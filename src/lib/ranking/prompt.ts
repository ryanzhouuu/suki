import { BT_PRIOR_LAMBDA, ELO_INITIAL_SCORE } from "@/lib/constants";
import { filterByGenre } from "@/lib/filters/genre";
import { getGenresBySeriesIds } from "@/lib/series/genres";
import { getCompletedSeriesForUser } from "@/lib/series/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { selectNextPair, type SeriesStat } from "./active-sampling";
import { pairKey } from "./canonical-pair";

export type SeriesComparisonPair = {
  left: Tables<"series"> & { entryCount: number };
  right: Tables<"series"> & { entryCount: number };
};

/** Uncertainty assigned to a completed series with no ranking row yet (an
 * edge-less Bradley-Terry series gets exactly this from the prior). */
const DEFAULT_UNCERTAINTY = 1 / BT_PRIOR_LAMBDA;

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
    seriesList = filterByGenre(
      seriesList,
      genreFilter,
      (s) => genresBySeries.get(s.id) ?? [],
    );
  }

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
    .select("series_id, score, comparison_count, uncertainty")
    .eq("user_id", userId);

  const rankingBySeriesId = new Map(
    (rankings ?? []).map((r) => [r.series_id, r]),
  );

  const stats: SeriesStat[] = seriesList.map((series) => {
    const row = rankingBySeriesId.get(series.id);
    return {
      seriesId: series.id,
      score: row ? Number(row.score) : ELO_INITIAL_SCORE,
      uncertainty:
        row?.uncertainty != null
          ? Number(row.uncertainty)
          : DEFAULT_UNCERTAINTY,
      comparisonCount: row?.comparison_count ?? 0,
    };
  });

  const pick = selectNextPair(stats, seenPairs, { rng: Math.random });
  if (!pick) return null;

  const seriesById = new Map(seriesList.map((s) => [s.id, s]));
  const left = seriesById.get(pick[0]);
  const right = seriesById.get(pick[1]);
  if (!left || !right) return null;

  return { left, right };
}
