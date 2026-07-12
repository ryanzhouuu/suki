export type Dependency = "supabase" | "anilist" | "openai" | "internal";

export type FailureKind =
  | "timeout"
  | "rate_limited"
  | "unavailable"
  | "configuration"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_request"
  | "unexpected";

export type ResilienceFailure = {
  dependency: Dependency;
  kind: Exclude<FailureKind, "unexpected">;
  retryable: boolean;
  correlationId: string;
  safeMessage: string;
};

export type ResilientResult<T> =
  | { status: "loaded"; data: T }
  | { status: "unavailable"; failure: ResilienceFailure };

export type OperationContext = {
  route: string;
  operation: string;
  dependency: Dependency;
  userId?: string;
  resourceId?: string;
};

export type ClassifiedFailure = {
  kind: Exclude<FailureKind, "unexpected">;
  retryable: boolean;
  providerStatus?: number;
  providerCode?: string;
};

const TRANSIENT_DATABASE_CODES = /^(08|53|57P0|58)/;
const VALIDATION_DATABASE_CODES = /^(22|23)/;
const CONFIGURATION_CODES = new Set([
  "invalid_api_key",
  "invalid_request_error",
  "insufficient_quota",
]);

function asRecord(error: unknown): Record<string, unknown> | null {
  return typeof error === "object" && error !== null
    ? (error as Record<string, unknown>)
    : null;
}

function statusOf(error: Record<string, unknown>): number | undefined {
  const status = error.status ?? error.statusCode;
  return typeof status === "number" && Number.isInteger(status)
    ? status
    : undefined;
}

function codeOf(error: Record<string, unknown>): string | undefined {
  const code = error.code;
  return typeof code === "string" ? code : undefined;
}

function fromStatus(
  status: number,
  providerCode?: string,
): ClassifiedFailure | null {
  if (status === 401) {
    return { kind: "unauthorized", retryable: false, providerStatus: status, providerCode };
  }
  if (status === 403) {
    return { kind: "forbidden", retryable: false, providerStatus: status, providerCode };
  }
  if (status === 404) {
    return { kind: "not_found", retryable: false, providerStatus: status, providerCode };
  }
  if (status === 408 || status === 504) {
    return { kind: "timeout", retryable: true, providerStatus: status, providerCode };
  }
  if (status === 429) {
    const configuration = providerCode === "insufficient_quota";
    return {
      kind: configuration ? "configuration" : "rate_limited",
      retryable: !configuration,
      providerStatus: status,
      providerCode,
    };
  }
  if (status >= 500 && status <= 599) {
    return { kind: "unavailable", retryable: true, providerStatus: status, providerCode };
  }
  if (status >= 400 && status <= 499) {
    return { kind: "invalid_request", retryable: false, providerStatus: status, providerCode };
  }
  return null;
}

function classifyAbort(error: unknown): ClassifiedFailure | null {
  const record = asRecord(error);
  if (!record) return null;
  if (record.name === "AbortError" || record.name === "TimeoutError") {
    return { kind: "timeout", retryable: true };
  }
  return null;
}

function classifyOpenAI(error: unknown): ClassifiedFailure | null {
  const record = asRecord(error);
  if (!record) return null;
  const name = typeof record.name === "string" ? record.name : undefined;
  const code = codeOf(record);

  if (name === "APIConnectionTimeoutError") {
    return { kind: "timeout", retryable: true, providerCode: code };
  }
  if (name === "APIConnectionError") {
    return { kind: "unavailable", retryable: true, providerCode: code };
  }
  const status = statusOf(record);
  if (status !== undefined) return fromStatus(status, code);
  if (code && CONFIGURATION_CODES.has(code)) {
    return { kind: "configuration", retryable: false, providerCode: code };
  }
  return null;
}

function classifySupabase(error: unknown): ClassifiedFailure | null {
  const record = asRecord(error);
  if (!record) return null;
  const code = codeOf(record);
  const status = statusOf(record);
  if (status !== undefined) return fromStatus(status, code);
  if (!code) return null;

  if (code === "42501") return { kind: "forbidden", retryable: false, providerCode: code };
  if (code === "PGRST301" || code === "PGRST302") {
    return { kind: "unauthorized", retryable: false, providerCode: code };
  }
  if (code === "PGRST116") return { kind: "not_found", retryable: false, providerCode: code };
  if (code === "57014") return { kind: "timeout", retryable: true, providerCode: code };
  if (TRANSIENT_DATABASE_CODES.test(code)) {
    return { kind: "unavailable", retryable: true, providerCode: code };
  }
  if (VALIDATION_DATABASE_CODES.test(code) || code.startsWith("PGRST")) {
    return { kind: "invalid_request", retryable: false, providerCode: code };
  }
  return null;
}

function classifyAniList(error: unknown): ClassifiedFailure | null {
  const record = asRecord(error);
  if (record) {
    const status = statusOf(record);
    if (status !== undefined) return fromStatus(status, codeOf(record));
  }

  // The current AniList adapter throws plain Errors. Keep this compatibility
  // fallback limited to the adapter's exact, stable message formats.
  if (!(error instanceof Error)) return null;
  const statusMatch = /^AniList request failed: (\d{3})$/.exec(error.message);
  if (statusMatch) return fromStatus(Number(statusMatch[1]));
  if (/^AniList rate limit exceeded \(429\)\./.test(error.message)) {
    return { kind: "rate_limited", retryable: true, providerStatus: 429 };
  }
  if (error.message === "AniList returned no data") {
    return { kind: "unavailable", retryable: true };
  }
  return null;
}

function classifyConfiguration(error: unknown): ClassifiedFailure | null {
  if (!(error instanceof Error)) return null;
  if (
    /^Missing required environment variable: [A-Z][A-Z0-9_]*$/.test(error.message) ||
    /^[A-Z][A-Z0-9_]* (?:is not set|must be set)(?:\..*)?$/.test(error.message)
  ) {
    return { kind: "configuration", retryable: false };
  }
  return null;
}

export function classifyResilienceError(
  dependency: Dependency,
  error: unknown,
): ClassifiedFailure | null {
  const abort = classifyAbort(error);
  if (abort) return abort;

  const configuration = classifyConfiguration(error);
  if (configuration) return configuration;

  if (dependency === "openai") return classifyOpenAI(error);
  if (dependency === "supabase") return classifySupabase(error);
  if (dependency === "anilist") return classifyAniList(error);
  return null;
}

export function safeMessageFor(kind: Exclude<FailureKind, "unexpected">): string {
  switch (kind) {
    case "timeout":
      return "This content took too long to load. Please try again.";
    case "rate_limited":
      return "This content is temporarily busy. Please try again shortly.";
    case "unavailable":
      return "This content is temporarily unavailable. Please try again.";
    case "configuration":
      return "This content is currently unavailable.";
    case "unauthorized":
      return "Please sign in to continue.";
    case "forbidden":
      return "You do not have access to this content.";
    case "not_found":
      return "This content could not be found.";
    case "invalid_request":
      return "This content could not be loaded.";
  }
}
