import "server-only";

/**
 * Supabase secret API key (https://supabase.com/docs/guides/api/api-keys)
 *
 * Secret (`sb_secret_...`) — server-only, bypasses RLS. Replaces legacy `service_role`.
 */

function missingKeyMessage(primary: string, legacy?: string): string {
  if (legacy) {
    return `Missing ${primary} (or legacy ${legacy})`;
  }
  return `Missing ${primary}`;
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
