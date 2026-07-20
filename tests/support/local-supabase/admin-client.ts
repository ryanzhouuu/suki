import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  assertLocalE2eEnvironment,
  type E2eEnvironment,
} from "./local-safety";

export function createLocalAdminClient(): SupabaseClient<Database> {
  assertLocalE2eEnvironment(process.env as E2eEnvironment);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Local test environment is missing the Supabase secret key.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function throwOnSupabaseError(
  operation: string,
  error: { message: string } | null,
): void {
  if (error) throw new Error(`Local fixture ${operation} failed: ${error.message}`);
}
