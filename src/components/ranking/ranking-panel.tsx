"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { fetchComparisonPair } from "@/actions/ranking";
import { ComparisonView } from "@/components/ranking/comparison-view";
import { RankedList } from "@/components/ranking/ranked-list";
import { GenreFilter } from "@/components/filters/genre-filter";
import { matchesAnyGenre } from "@/lib/filters/genre";
import { useGenreFromUrl, useSetGenreInUrl } from "@/lib/filters/use-genre-url";
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
  const genresFromUrl = useGenreFromUrl();
  const setGenresInUrl = useSetGenreInUrl();
  const [pair, setPair] = useState<SeriesComparisonPair | null>(initialPair);
  const [pairError, setPairError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const genresMap = useMemo(
    () => new Map(Object.entries(genresBySeriesId)),
    [genresBySeriesId],
  );

  const filteredRankings = useMemo(() => {
    if (genresFromUrl.length === 0) return rankings;
    return rankings.filter((row) => {
      if (!row.series_id) return false;
      const genres = genresMap.get(row.series_id) ?? [];
      return matchesAnyGenre(genres, genresFromUrl);
    });
  }, [rankings, genresFromUrl, genresMap]);

  const refreshPair = useCallback((genres: string[]) => {
    startTransition(async () => {
      const result = await fetchComparisonPair(genres);
      if (result.error) {
        setPairError(result.error);
        setPair(null);
        return;
      }
      setPairError(null);
      setPair(result.pair);
    });
  }, []);

  const genresKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = genresFromUrl.join("\0");
    if (genresKeyRef.current === null) {
      genresKeyRef.current = key;
      return;
    }
    if (genresKeyRef.current === key) return;
    genresKeyRef.current = key;
    refreshPair(genresFromUrl);
  }, [genresFromUrl, refreshPair]);

  const genreFiltering = genresFromUrl.length > 0;
  const canCompare = completedSeriesCount >= 2;

  return (
    <div className="space-y-12">
      {canCompare ? (
        <GenreFilter selected={genresFromUrl} onChange={setGenresInUrl} />
      ) : null}

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
          <p className="mb-3 text-sm text-muted">
            {filteredRankings.length} of {rankings.length}{" "}
            {rankings.length === 1 ? "series" : "series"} match
          </p>
        ) : null}
        <RankedList
          rankings={filteredRankings}
          genresBySeriesId={genresBySeriesId}
        />
      </section>
    </div>
  );
}
