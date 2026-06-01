import { anilistQuery } from "@/lib/anilist/client";
import { mapAniListMediaToAnimeRow } from "@/lib/anilist/map";
import { ANIME_DETAIL_QUERY } from "@/lib/anilist/queries";
import type { AniListMediaResult } from "@/lib/anilist/types";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import { syncAnimeEmbedding } from "@/lib/recommendations/sync-anime-embedding";
import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/database";

const METADATA_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export type CatalogSyncOptions = {
  /** One AniList request per title (skips franchise relation crawl). Use for batch seeds. */
  lightweightSeriesMapping?: boolean;
  /** Skip OpenAI embedding (metadata + series map only). */
  skipEmbedding?: boolean;
  /** Re-fetch from AniList even when cached metadata is fresh. */
  forceRefresh?: boolean;
};

/** Server/admin cache + embed (for scripts and catalog seeding). */
export async function syncAnimeCatalogFromAnilist(
  anilistId: number,
  options?: CatalogSyncOptions,
): Promise<Tables<"anime">> {
  const admin = createAdminClient();
  const { data: cached } = await admin
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  if (cached?.metadata_updated_at && !options?.forceRefresh) {
    const age = Date.now() - new Date(cached.metadata_updated_at).getTime();
    if (age < METADATA_STALE_MS) {
      await ensureAnimeSeriesMapping(cached, {
        lightweight: options?.lightweightSeriesMapping,
      });
      if (!options?.skipEmbedding && isEmbeddingConfigured()) {
        void syncAnimeEmbedding(cached).catch(() => undefined);
      }
      return cached;
    }
  }

  const result = await anilistQuery<AniListMediaResult>(ANIME_DETAIL_QUERY, {
    id: anilistId,
  });

  if (!result.Media) {
    throw new Error(`Anime ${anilistId} not found on AniList`);
  }

  const row = mapAniListMediaToAnimeRow(result.Media);

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

  if (!options?.skipEmbedding && isEmbeddingConfigured()) {
    await syncAnimeEmbedding(data);
  }

  return data;
}
