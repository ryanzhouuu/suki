import type { Tables } from "@/types/database";

import { filterByGenre } from "./genre";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

export function filterRankingsByGenre(
  rankings: RankedSeriesRow[],
  selectedGenres: string[],
  genresBySeriesId: Record<string, string[]>,
): RankedSeriesRow[] {
  return filterByGenre(
    rankings,
    selectedGenres,
    (row) => genresBySeriesId[row.series_id] ?? [],
  );
}
