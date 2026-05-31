import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseSecretKey } from "./env-keys";

/**
 * Secret-key client for server-only operations (e.g. series mappings, derived_series_rankings).
 * Uses Supabase secret key (`sb_secret_...`), not the publishable key.
 * Never import this from client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set");
  }

  return createClient<Database>(url, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
