import "server-only";

import { getSupabasePublishableKey } from "@/lib/supabase/env-keys";
import { getSupabaseSecretKey } from "@/lib/supabase/secret-key";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: getSupabasePublishableKey,
  /** @deprecated Use supabasePublishableKey — legacy anon JWT name */
  supabaseAnonKey: getSupabasePublishableKey,
  supabaseSecretKey: () => {
    try {
      return getSupabaseSecretKey();
    } catch {
      return undefined;
    }
  },
  /** @deprecated Use supabaseSecretKey — legacy service_role name */
  supabaseServiceRoleKey: () => {
    try {
      return getSupabaseSecretKey();
    } catch {
      return undefined;
    }
  },
  databaseUrl: () => process.env.DATABASE_URL,
  siteUrl: () =>
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  openAiApiKey: () => process.env.OPENAI_API_KEY,
};
