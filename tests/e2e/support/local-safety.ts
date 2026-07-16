export const LOCAL_SUPABASE_API_PORT = 54321;
export const LOCAL_SUPABASE_DB_PORT = 54322;

export type E2eEnvironment = {
  E2E_TEST_MODE?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  DATABASE_URL?: string;
};

function loopbackHost(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function portFor(url: URL, defaultPort: number): number {
  return url.port ? Number(url.port) : defaultPort;
}

function requireUrl(value: string | undefined, name: string): URL {
  if (!value) throw new Error(`Missing ${name}; refusing E2E mutation.`);

  try {
    return new URL(value);
  } catch {
    throw new Error(`Invalid ${name}; refusing E2E mutation.`);
  }
}

export function assertLocalE2eEnvironment(
  environment: E2eEnvironment,
): void {
  if (environment.E2E_TEST_MODE !== "1") {
    throw new Error("E2E_TEST_MODE must be 1 for local E2E mutations.");
  }

  const apiUrl = requireUrl(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  if (
    apiUrl.protocol !== "http:" ||
    !loopbackHost(apiUrl.hostname) ||
    portFor(apiUrl, 80) !== LOCAL_SUPABASE_API_PORT
  ) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be http://127.0.0.1:${LOCAL_SUPABASE_API_PORT} or localhost equivalent.`,
    );
  }

  const databaseUrl = requireUrl(environment.DATABASE_URL, "DATABASE_URL");
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !loopbackHost(databaseUrl.hostname) ||
    portFor(databaseUrl, 5432) !== LOCAL_SUPABASE_DB_PORT
  ) {
    throw new Error(
      `DATABASE_URL must target a loopback Postgres server on port ${LOCAL_SUPABASE_DB_PORT}.`,
    );
  }
}
