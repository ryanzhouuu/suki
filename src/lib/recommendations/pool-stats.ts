import { getUserLibraryEntries } from "@/lib/library/queries";
import { createAdminClient } from "@/lib/supabase/admin";

import { getRecommendationExclusions } from "./exclusions";

export type RecommendationPoolStats = {
  embeddedCount: number;
  libraryCount: number;
  eligibleCount: number;
};

/** How many embedded titles can still be recommended for this user. */
export async function getRecommendationPoolStats(
  userId: string,
): Promise<RecommendationPoolStats> {
  const admin = createAdminClient();
  const [exclusions, libraryEntries] = await Promise.all([
    getRecommendationExclusions(userId),
    getUserLibraryEntries(userId),
  ]);
  const libraryCount = libraryEntries.length;

  const { count: embeddedCount, error: countError } = await admin
    .from("anime_embeddings")
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;

  const excludedAnime = new Set(exclusions.excludedAnimeIds);
  const excludedSeries = new Set(exclusions.excludedSeriesIds);

  const { data: embeddedRows, error: embeddedRowsError } = await admin
    .from("anime_embeddings")
    .select("anime_id");

  if (embeddedRowsError) throw embeddedRowsError;

  const animeIds = (embeddedRows ?? []).map((r) => r.anime_id);
  if (animeIds.length === 0) {
    return {
      embeddedCount: embeddedCount ?? 0,
      libraryCount,
      eligibleCount: 0,
    };
  }

  const { data: maps, error: mapsError } = await admin
    .from("anime_series_map")
    .select("anime_id, series_id")
    .in("anime_id", animeIds);

  if (mapsError) throw mapsError;

  const seriesByAnime = new Map(
    (maps ?? []).map((m) => [m.anime_id, m.series_id]),
  );

  let eligibleCount = 0;
  for (const animeId of animeIds) {
    if (excludedAnime.has(animeId)) continue;
    const seriesId = seriesByAnime.get(animeId);
    if (seriesId && excludedSeries.has(seriesId)) continue;
    eligibleCount += 1;
  }

  return {
    embeddedCount: embeddedCount ?? 0,
    libraryCount,
    eligibleCount,
  };
}
