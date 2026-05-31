import { anilistQuery } from "@/lib/anilist/client";
import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";
import { ANIME_DETAIL_QUERY } from "@/lib/anilist/queries";
import type { AniListMediaResult } from "@/lib/anilist/types";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { syncAnimeFromAnilist } from "./sync";

export async function getAnimeForDisplay(
  anilistId: number,
): Promise<Tables<"anime">> {
  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  if (cached) return cached;

  const user = await getAuthUser();
  if (user) {
    return syncAnimeFromAnilist(anilistId);
  }

  const result = await anilistQuery<AniListMediaResult>(ANIME_DETAIL_QUERY, {
    id: anilistId,
  });

  if (!result.Media) {
    throw new Error("Anime not found");
  }

  const row = mapAniListMediaToAnimeRow(result.Media);
  return {
    id: "",
    ...row,
    metadata_updated_at: row.metadata_updated_at ?? new Date().toISOString(),
  } as Tables<"anime">;
}
