import { fetchAnimeDetail } from "@/lib/anilist/detail";
import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { AnimeNotFoundError } from "./errors";
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

  const result = await fetchAnimeDetail(anilistId);

  if (!result.Media) {
    throw new AnimeNotFoundError(anilistId);
  }

  const row = mapAniListMediaToAnimeRow(result.Media);
  return {
    id: "",
    ...row,
    metadata_updated_at: row.metadata_updated_at ?? new Date().toISOString(),
  } as Tables<"anime">;
}
