import type { AnimeEntryStatus } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reads a *recipient's* library status for a given anime so the sender can be
 * warned the friend may have already seen it. Uses the admin client because
 * library entries are RLS-private — the same trusted cross-user read pattern
 * the friend activity feed uses. The caller must have verified an accepted
 * friendship first.
 */
export async function getRecipientAnimeStatus(
  recipientUserId: string,
  animeId: string,
): Promise<AnimeEntryStatus | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("user_anime_entries")
    .select("status")
    .eq("user_id", recipientUserId)
    .eq("anime_id", animeId)
    .maybeSingle();

  return (data?.status as AnimeEntryStatus | undefined) ?? null;
}
