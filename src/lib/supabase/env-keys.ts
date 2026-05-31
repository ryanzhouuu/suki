/**
 * Supabase API keys (https://supabase.com/docs/guides/api/api-keys)
 *
 * - Publishable (`sb_publishable_...`) — client-safe, RLS applies. Replaces legacy `anon`.
 * - Secret (`sb_secret_...`) — server-only, bypasses RLS. Replaces legacy `service_role`.
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

export function getSupabaseSecretKey(): string {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      missingKeyMessage("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    );
  }

  return key;
}
