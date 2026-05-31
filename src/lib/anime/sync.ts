import { anilistQuery } from "@/lib/anilist/client";
import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";
import { ANIME_DETAIL_QUERY } from "@/lib/anilist/queries";
import type { AniListMediaResult } from "@/lib/anilist/types";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

/** Sync requires an authenticated session (RLS on anime upsert). */
export async function syncAnimeFromAnilist(
  anilistId: number,
): Promise<Tables<"anime">> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  const staleMs = 7 * 24 * 60 * 60 * 1000;
  if (existing?.metadata_updated_at) {
    const age = Date.now() - new Date(existing.metadata_updated_at).getTime();
    if (age < staleMs) {
      return existing;
    }
  }

  const result = await anilistQuery<AniListMediaResult>(ANIME_DETAIL_QUERY, {
    id: anilistId,
  });

  if (!result.Media) {
    throw new Error("Anime not found on AniList");
  }

  const row = mapAniListMediaToAnimeRow(result.Media);

  const { data, error } = await supabase
    .from("anime")
    .upsert(row, { onConflict: "anilist_id" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cache anime metadata");
  }

  return data;
}
