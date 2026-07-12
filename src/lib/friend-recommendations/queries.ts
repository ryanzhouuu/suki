import { createClient } from "@/lib/supabase/server";

import {
  buildReceivedRecommendations,
  type ReceivedRecommendation,
  type ReceivedRecommendationRow,
  type SenderRef,
} from "./view-model";

const ANIME_SELECT =
  "id, anilist_id, romaji_title, english_title, cover_image_url, format, episodes";

/**
 * The viewer's pending inbox: incoming recommendations joined to the anime,
 * the sender's profile, and a flag for titles already in the viewer's library.
 * Reads run under the recipient's own RLS (select policy covers recipient_id).
 */
export async function getReceivedRecommendations(
  userId: string,
): Promise<ReceivedRecommendation[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("anime_recommendations")
    .select(`id, note, created_at, sender_id, anime:anime_id(${ANIME_SELECT})`)
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const recRows = (rows ?? []) as ReceivedRecommendationRow[];
  if (recRows.length === 0) return [];

  const senderIds = [...new Set(recRows.map((r) => r.sender_id))];
  const animeIds = [...new Set(recRows.map((r) => r.anime?.id).filter(Boolean))];

  const [sendersResult, ownedResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", senderIds),
    animeIds.length > 0
      ? supabase
          .from("user_anime_entries")
          .select("anime_id")
          .eq("user_id", userId)
          .in("anime_id", animeIds as string[])
      : Promise.resolve({
          data: [] as { anime_id: string }[],
          error: null,
        }),
  ]);
  if (sendersResult.error) throw sendersResult.error;
  if (ownedResult.error) throw ownedResult.error;

  const senders = new Map<string, SenderRef>(
    (sendersResult.data ?? []).map((p) => [p.user_id, p]),
  );
  const ownedAnimeIds = new Set(
    (ownedResult.data ?? []).map((e) => e.anime_id),
  );

  return buildReceivedRecommendations(recRows, senders, ownedAnimeIds);
}

/** Unseen pending recommendations — drives the Friends nav badge. */
export async function getUnreadRecommendationCount(
  userId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("anime_recommendations")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .is("seen_at", null);

  return count ?? 0;
}
