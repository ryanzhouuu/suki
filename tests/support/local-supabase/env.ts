import {
  buildLocalApplicationEnvironment as buildEnvironment,
  normalizeSupabaseStatus as normalizeStatus,
  parseSupabaseStatusEnv as parseStatusEnv,
} from "../../../scripts/lib/local-supabase.cjs";

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
  SERIES_ADMIN_EMAILS?: string;
};

export function parseSupabaseStatusEnv(output: string): SupabaseStatusEnvironment {
  return parseStatusEnv(output) as SupabaseStatusEnvironment;
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
  return normalizeStatus(output) as Pick<
    LocalApplicationEnvironment,
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    | "SUPABASE_SECRET_KEY"
    | "DATABASE_URL"
  >;
}

export function buildLocalApplicationEnvironment(
  statusOutput: string,
  overrides: Partial<LocalApplicationEnvironment> = {},
): LocalApplicationEnvironment {
  return buildEnvironment(statusOutput, overrides) as LocalApplicationEnvironment;
}

export const expectedLocalSupabasePorts = {
  api: LOCAL_SUPABASE_API_PORT,
  database: LOCAL_SUPABASE_DB_PORT,
};
