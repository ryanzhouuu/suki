import { getUserLibraryEntries, type LibraryEntry } from "@/lib/library/queries";
import { createClient } from "@/lib/supabase/server";

export type RecommendationExclusions = {
  excludedAnimeIds: string[];
  excludedSeriesIds: string[];
};

export async function getRecommendationExclusions(
  userId: string,
  entries?: LibraryEntry[],
): Promise<RecommendationExclusions> {
  const resolvedEntries = entries ?? (await getUserLibraryEntries(userId));

  const excludedAnimeIds = resolvedEntries.map((e) => e.anime_id);

  if (excludedAnimeIds.length === 0) {
    return { excludedAnimeIds: [], excludedSeriesIds: [] };
  }

  const supabase = await createClient();
  const { data: maps } = await supabase
    .from("anime_series_map")
    .select("series_id")
    .in("anime_id", excludedAnimeIds);

  const excludedSeriesIds = [
    ...new Set((maps ?? []).map((m) => m.series_id)),
  ];

  return { excludedAnimeIds, excludedSeriesIds };
}
