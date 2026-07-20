import { assertSafeLocalEnvironment } from "../../../scripts/lib/local-supabase.cjs";

export const LOCAL_SUPABASE_API_PORT = 54321;
export const LOCAL_SUPABASE_DB_PORT = 54322;

export type E2eEnvironment = {
  E2E_TEST_MODE?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  DATABASE_URL?: string;
};

export function assertLocalE2eEnvironment(environment: E2eEnvironment): void {
  assertSafeLocalEnvironment(environment);
}

export const assertLocalTestEnvironment = assertLocalE2eEnvironment;
