"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { fetchComparisonPair } from "@/actions/ranking";
import { ComparisonView } from "@/components/ranking/comparison-view";
import { RankedList } from "@/components/ranking/ranked-list";
import { FilterMatchCount } from "@/components/filters/filter-match-count";
import { GenreFilter } from "@/components/filters/genre-filter";
import { filterRankingsByGenre, useGenreFilters } from "@/lib/filters";
import type { SeriesComparisonPair } from "@/lib/ranking/prompt";
import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

type RankingPanelProps = {
  initialPair: SeriesComparisonPair | null;
  rankings: RankedSeriesRow[];
  genresBySeriesId: Record<string, string[]>;
  completedSeriesCount: number;
};

export function RankingPanel({
  initialPair,
  rankings,
  genresBySeriesId,
  completedSeriesCount,
}: RankingPanelProps) {
  const { genres, setGenres, genreKey, isFiltering: genreFiltering } =
    useGenreFilters();
  const [pair, setPair] = useState<SeriesComparisonPair | null>(initialPair);
  const [pairError, setPairError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredRankings = useMemo(
    () => filterRankingsByGenre(rankings, genres, genresBySeriesId),
    [rankings, genres, genresBySeriesId],
  );

  const refreshPair = useCallback((selectedGenres: string[]) => {
    startTransition(async () => {
      const result = await fetchComparisonPair(selectedGenres);
      if (result.error) {
        setPairError(result.error);
        setPair(null);
        return;
      }
      setPairError(null);
      setPair(result.pair);
    });
  }, []);

  const lastGenreKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastGenreKeyRef.current === null) {
      lastGenreKeyRef.current = genreKey;
      return;
    }
    if (lastGenreKeyRef.current === genreKey) return;
    lastGenreKeyRef.current = genreKey;
    refreshPair(genres);
  }, [genreKey, genres, refreshPair]);

  const canCompare = completedSeriesCount >= 2;

  return (
    <div className="space-y-12">
      {canCompare ? <GenreFilter selected={genres} onChange={setGenres} /> : null}

      {canCompare ? (
        <section className="space-y-4">
          {pending && !pair ? (
            <p className="text-sm text-muted">Loading comparison…</p>
          ) : null}
          {pairError ? (
            <p className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {pairError}
            </p>
          ) : null}
          {pair ? (
            <ComparisonView
              key={`${pair.left.id}:${pair.right.id}`}
              pair={pair}
            />
          ) : !pending && !pairError ? (
            <p className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">
              {genreFiltering
                ? "No more pairs to compare for the selected genres. Clear the filter or complete more series in those genres."
                : "No more unique pairs to compare right now. Check your ranking below or complete more series."}
            </p>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Your ranking</h2>
        {genreFiltering ? (
          <div className="mb-3">
            <FilterMatchCount
              matched={filteredRankings.length}
              total={rankings.length}
              noun="series"
            />
          </div>
        ) : null}
        <RankedList
          rankings={filteredRankings}
          genresBySeriesId={genresBySeriesId}
        />
      </section>
    </div>
  );
}
