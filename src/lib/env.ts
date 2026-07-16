import "server-only";

import { getSupabasePublishableKey } from "@/lib/supabase/env-keys";
import { getSupabaseSecretKey } from "@/lib/supabase/secret-key";

const REAL_ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";
}

function loopbackOverride(name: string): string | undefined {
  if (process.env.E2E_TEST_MODE !== "1") return undefined;

  const value = process.env[name];
  if (!value) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a loopback URL in E2E mode.`);
  }

  if (url.protocol !== "http:" || !isLoopbackHostname(url.hostname)) {
    throw new Error(`${name} must be a loopback HTTP URL in E2E mode.`);
  }

  return url.toString().replace(/\/$/, "");
}

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
  openAiBaseUrl: () => loopbackOverride("OPENAI_BASE_URL"),
  anilistGraphqlUrl: () =>
    loopbackOverride("ANILIST_GRAPHQL_URL") ?? REAL_ANILIST_GRAPHQL_URL,
};
