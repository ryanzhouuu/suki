import { matchesAnyGenre } from "@/lib/filters/genre";
import { getGenresBySeriesIds } from "@/lib/series/genres";
import { getCompletedSeriesForUser } from "@/lib/series/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { pairKey } from "./canonical-pair";
import { resolvedComparisonsFromRows } from "./preference-graph";
import {
  shouldSkipComparisonByRankDistance,
  type RankContext,
} from "./prompt-skip";

export type SeriesComparisonPair = {
  left: Tables<"series"> & { entryCount: number };
  right: Tables<"series"> & { entryCount: number };
};

function scoreCandidatePair(
  leftId: string,
  rightId: string,
  scoreMap: Map<string, { score: number; count: number }>,
): number {
  const leftMeta = scoreMap.get(leftId) ?? { score: 1500, count: 0 };
  const rightMeta = scoreMap.get(rightId) ?? { score: 1500, count: 0 };
  const scoreDiff = Math.abs(leftMeta.score - rightMeta.score);
  const lowComparisonBonus = (10 - leftMeta.count) + (10 - rightMeta.count);
  return lowComparisonBonus * 10 - scoreDiff;
}

export type GetNextComparisonPairOptions = {
  genreFilter?: string[];
};

export async function getNextComparisonPair(
  userId: string,
  options?: GetNextComparisonPairOptions,
): Promise<SeriesComparisonPair | null> {
  let seriesList = await getCompletedSeriesForUser(userId);

  const genreFilter = options?.genreFilter ?? [];
  if (genreFilter.length > 0) {
    const genresBySeries = await getGenresBySeriesIds(
      seriesList.map((s) => s.id),
    );
    seriesList = seriesList.filter((s) =>
      matchesAnyGenre(genresBySeries.get(s.id) ?? [], genreFilter),
    );
  }

  if (seriesList.length < 2) return null;

  const supabase = await createClient();

  const { data: comparisons } = await supabase
    .from("pairwise_series_comparisons")
    .select("left_series_id, right_series_id, winner_series_id")
    .eq("user_id", userId);

  const seenPairs = new Set(
    (comparisons ?? []).map((c) =>
      pairKey(c.left_series_id, c.right_series_id),
    ),
  );

  const resolved = resolvedComparisonsFromRows(comparisons ?? []);

  const { data: rankings } = await supabase
    .from("derived_series_rankings")
    .select("series_id, rank, score, comparison_count")
    .eq("user_id", userId);

  const scoreMap = new Map(
    (rankings ?? []).map((r) => [
      r.series_id,
      { score: Number(r.score), count: r.comparison_count },
    ]),
  );

  const rankContext: RankContext = {
    rankBySeriesId: new Map(
      (rankings ?? []).map((r) => [r.series_id, r.rank]),
    ),
    comparisonCountBySeriesId: new Map(
      (rankings ?? []).map((r) => [r.series_id, r.comparison_count]),
    ),
  };

  const fallbackRank = seriesList.length;
  for (const series of seriesList) {
    if (!rankContext.rankBySeriesId.has(series.id)) {
      rankContext.rankBySeriesId.set(series.id, fallbackRank);
    }
    if (!rankContext.comparisonCountBySeriesId.has(series.id)) {
      rankContext.comparisonCountBySeriesId.set(series.id, 0);
    }
  }

  let bestPair: SeriesComparisonPair | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < seriesList.length; i++) {
    for (let j = i + 1; j < seriesList.length; j++) {
      const left = seriesList[i];
      const right = seriesList[j];
      if (seenPairs.has(pairKey(left.id, right.id))) continue;

      if (
        shouldSkipComparisonByRankDistance(left.id, right.id, resolved, rankContext)
      ) {
        continue;
      }

      const pairScore = scoreCandidatePair(left.id, right.id, scoreMap);

      if (pairScore > bestScore) {
        bestScore = pairScore;
        bestPair = { left, right };
      }
    }
  }

  return bestPair;
}
