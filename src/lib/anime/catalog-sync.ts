import { anilistQuery } from "@/lib/anilist/client";
import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";
import { ANIME_DETAIL_QUERY } from "@/lib/anilist/queries";
import type { AniListMediaResult } from "@/lib/anilist/types";
import { syncAnimeEmbedding } from "@/lib/recommendations/sync-anime-embedding";
import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

export type CatalogSyncOptions = {
  /** One AniList request per title (skips franchise relation crawl). Use for batch seeds. */
  lightweightSeriesMapping?: boolean;
};

/** Server/admin cache + embed (for scripts and catalog seeding). */
export async function syncAnimeCatalogFromAnilist(
  anilistId: number,
  options?: CatalogSyncOptions,
): Promise<Tables<"anime">> {
  const result = await anilistQuery<AniListMediaResult>(ANIME_DETAIL_QUERY, {
    id: anilistId,
  });

  if (!result.Media) {
    throw new Error(`Anime ${anilistId} not found on AniList`);
  }

  const row = mapAniListMediaToAnimeRow(result.Media);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("anime")
    .upsert(row, { onConflict: "anilist_id" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to cache anime metadata");
  }

  await ensureAnimeSeriesMapping(data, {
    lightweight: options?.lightweightSeriesMapping,
  });
  await syncAnimeEmbedding(data);

  return data;
}
