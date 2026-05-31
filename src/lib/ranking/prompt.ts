import { getCompletedSeriesForUser } from "@/lib/series/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { pairKey } from "./canonical-pair";

export type SeriesComparisonPair = {
  left: Tables<"series"> & { entryCount: number };
  right: Tables<"series"> & { entryCount: number };
};

export async function getNextComparisonPair(
  userId: string,
): Promise<SeriesComparisonPair | null> {
  const seriesList = await getCompletedSeriesForUser(userId);

  if (seriesList.length < 2) return null;

  const supabase = await createClient();

  const { data: comparisons } = await supabase
    .from("pairwise_series_comparisons")
    .select("left_series_id, right_series_id")
    .eq("user_id", userId);

  const seenPairs = new Set(
    (comparisons ?? []).map((c) =>
      pairKey(c.left_series_id, c.right_series_id),
    ),
  );

  const { data: rankings } = await supabase
    .from("derived_series_rankings")
    .select("series_id, score, comparison_count")
    .eq("user_id", userId);

  const scoreMap = new Map(
    (rankings ?? []).map((r) => [
      r.series_id,
      { score: Number(r.score), count: r.comparison_count },
    ]),
  );

  let bestPair: SeriesComparisonPair | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < seriesList.length; i++) {
    for (let j = i + 1; j < seriesList.length; j++) {
      const left = seriesList[i];
      const right = seriesList[j];
      if (seenPairs.has(pairKey(left.id, right.id))) continue;

      const leftMeta = scoreMap.get(left.id) ?? { score: 1500, count: 0 };
      const rightMeta = scoreMap.get(right.id) ?? { score: 1500, count: 0 };
      const scoreDiff = Math.abs(leftMeta.score - rightMeta.score);
      const lowComparisonBonus = (10 - leftMeta.count) + (10 - rightMeta.count);
      const pairScore = lowComparisonBonus * 10 - scoreDiff;

      if (pairScore > bestScore) {
        bestScore = pairScore;
        bestPair = { left, right };
      }
    }
  }

  return bestPair;
}
