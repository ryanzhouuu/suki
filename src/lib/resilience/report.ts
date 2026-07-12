import "server-only";

import type { ClassifiedFailure, OperationContext } from "./errors";

export type ResilienceReport = {
  event: "dependency_operation_failed";
  level: "warn" | "error";
  correlation_id: string;
  route: string;
  operation: string;
  dependency: OperationContext["dependency"];
  kind: ClassifiedFailure["kind"];
  retryable: boolean;
  duration_ms: number;
  provider_status?: number;
  provider_code?: string;
};

export type ResilienceReportSink = (report: ResilienceReport) => void;

const SAFE_PROVIDER_CODE = /^(?:[0-9A-Z]{5}|PGRST\d{3}|[a-z][a-z0-9_]{0,63})$/;

function allowProviderStatus(value: number | undefined): number | undefined {
  return value !== undefined && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : undefined;
}

function allowProviderCode(value: string | undefined): string | undefined {
  return value && SAFE_PROVIDER_CODE.test(value) ? value : undefined;
}

export function createResilienceReport(
  context: OperationContext,
  failure: ClassifiedFailure,
  correlationId: string,
  durationMs: number,
): ResilienceReport {
  const providerStatus = allowProviderStatus(failure.providerStatus);
  const providerCode = allowProviderCode(failure.providerCode);
  return {
    event: "dependency_operation_failed",
    level: failure.retryable ? "warn" : "error",
    correlation_id: correlationId,
    route: context.route,
    operation: context.operation,
    dependency: context.dependency,
    kind: failure.kind,
    retryable: failure.retryable,
    duration_ms: Math.max(0, Math.round(durationMs)),
    ...(providerStatus === undefined ? {} : { provider_status: providerStatus }),
    ...(providerCode === undefined ? {} : { provider_code: providerCode }),
  };
}

export const consoleResilienceReportSink: ResilienceReportSink = (report) => {
  const serialized = JSON.stringify(report);
  if (report.level === "warn") console.warn(serialized);
  else console.error(serialized);
};

export function reportResilienceFailure(
  context: OperationContext,
  failure: ClassifiedFailure,
  correlationId: string,
  durationMs: number,
  sink: ResilienceReportSink = consoleResilienceReportSink,
): void {
  sink(createResilienceReport(context, failure, correlationId, durationMs));
}
