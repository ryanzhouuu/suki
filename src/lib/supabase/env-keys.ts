/**
 * Supabase API keys (https://supabase.com/docs/guides/api/api-keys)
 *
 * - Publishable (`sb_publishable_...`) — client-safe, RLS applies. Replaces legacy `anon`.
 *
 * The secret key (server-only, bypasses RLS) lives in `./secret-key` behind a
 * `server-only` guard — this module stays guard-free since client code imports it.
 */

function missingKeyMessage(primary: string, legacy?: string): string {
  if (legacy) {
    return `Missing ${primary} (or legacy ${legacy})`;
  }
  return `Missing ${primary}`;
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      missingKeyMessage(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ),
    );
  }

  return key;
}
