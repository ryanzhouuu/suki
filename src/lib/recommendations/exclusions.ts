import { getUserLibraryEntries, type LibraryEntry } from "@/lib/library/queries";
import { createClient } from "@/lib/supabase/server";

import { getDismissedAnimeIds } from "./dismissed";

export type RecommendationExclusions = {
  excludedAnimeIds: string[];
  excludedSeriesIds: string[];
};

export async function getRecommendationExclusions(
  userId: string,
  entries?: LibraryEntry[],
): Promise<RecommendationExclusions> {
  const resolvedEntries = entries ?? (await getUserLibraryEntries(userId));

  const dismissedIds = await getDismissedAnimeIds(userId);
  const excludedAnimeIds = [
    ...new Set([
      ...resolvedEntries.map((e) => e.anime_id),
      ...dismissedIds,
    ]),
  ];

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
