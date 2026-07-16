import {
  LOCAL_SUPABASE_API_PORT,
  LOCAL_SUPABASE_DB_PORT,
} from "./local-safety";

type SupabaseStatusEnvironment = Record<string, string>;

export type LocalApplicationEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY: string;
  DATABASE_URL: string;
  NEXT_PUBLIC_SITE_URL: string;
  E2E_TEST_MODE: "1";
  ANILIST_GRAPHQL_URL: string;
  OPENAI_BASE_URL: string;
  OPENAI_API_KEY: string;
};

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return trimmed;
}

export function parseSupabaseStatusEnv(output: string): SupabaseStatusEnvironment {
  const parsed: SupabaseStatusEnvironment = {};

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(trimmed);
    if (match) parsed[match[1]] = unquote(match[2]);
  }

  return parsed;
}

function firstValue(
  values: SupabaseStatusEnvironment,
  names: string[],
  label: string,
): string {
  for (const name of names) {
    if (values[name]) return values[name];
  }
  throw new Error(`Supabase status output is missing ${label}.`);
}

export function normalizeSupabaseStatus(
  output: string,
): Pick<
  LocalApplicationEnvironment,
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  | "SUPABASE_SECRET_KEY"
  | "DATABASE_URL"
> {
  const values = parseSupabaseStatusEnv(output);

  return {
    NEXT_PUBLIC_SUPABASE_URL: firstValue(
      values,
      ["API_URL", "SUPABASE_URL"],
      "the local API URL",
    ),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: firstValue(
      values,
      ["PUBLISHABLE_KEY", "ANON_KEY", "SUPABASE_PUBLISHABLE_KEY"],
      "the publishable key",
    ),
    SUPABASE_SECRET_KEY: firstValue(
      values,
      ["SECRET_KEY", "SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
      "the secret key",
    ),
    DATABASE_URL: firstValue(
      values,
      ["DB_URL", "DATABASE_URL"],
      "the database URL",
    ),
  };
}

export function buildLocalApplicationEnvironment(
  statusOutput: string,
): LocalApplicationEnvironment {
  const normalized = normalizeSupabaseStatus(statusOutput);

  return {
    ...normalized,
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
    E2E_TEST_MODE: "1",
    ANILIST_GRAPHQL_URL: "http://127.0.0.1:4100/anilist/graphql",
    OPENAI_BASE_URL: "http://127.0.0.1:4100/openai/v1",
    OPENAI_API_KEY: "e2e-placeholder",
  };
}

export const expectedLocalSupabasePorts = {
  api: LOCAL_SUPABASE_API_PORT,
  database: LOCAL_SUPABASE_DB_PORT,
};
