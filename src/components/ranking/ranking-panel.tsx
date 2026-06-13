"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { fetchComparisonPair } from "@/actions/ranking";
import { ComparisonView } from "@/components/ranking/comparison-view";
import { RankedList } from "@/components/ranking/ranked-list";
import {
  RankingViewToggle,
  useRankingView,
  type RankingView,
} from "@/components/ranking/ranking-view-toggle";
import { TierListView } from "@/components/ranking/tier-list-view";
import { FilterMatchCount } from "@/components/filters/filter-match-count";
import { GenreFilter } from "@/components/filters/genre-filter";
import { ControlRail } from "@/components/layout/page-frame";
import { CONFIDENCE_LABELS } from "@/lib/constants";
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
  initialView: RankingView;
};

export function RankingPanel({
  initialPair,
  rankings,
  genresBySeriesId,
  completedSeriesCount,
  initialView,
}: RankingPanelProps) {
  const { genres, setGenres, genreKey, isFiltering: genreFiltering } =
    useGenreFilters();
  const { view, setView } = useRankingView(initialView);
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

  const confidenceCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    for (const row of rankings) counts[row.confidence] += 1;
    return counts;
  }, [rankings]);

  return (
    <ControlRail
      sidebarLabel="Ranking filters and progress"
      sidebar={
        <div className="space-y-4">
          <div className="rounded-card border border-line bg-surface p-4">
            <p className="eyebrow">Taste lab</p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Completed series</dt>
                <dd className="font-display text-base font-semibold tabular-nums text-ink">
                  {completedSeriesCount}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Ranked series</dt>
                <dd className="font-display text-base font-semibold tabular-nums text-ink">
                  {rankings.length}
                </dd>
              </div>
            </dl>
            {rankings.length > 0 ? (
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {(["high", "medium", "low"] as const).map((level) => (
                  <li
                    key={level}
                    className="flex items-center justify-between gap-3 text-xs text-muted"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${
                          level === "high"
                            ? "bg-success"
                            : level === "medium"
                              ? "bg-accent"
                              : "bg-faint"
                        }`}
                      />
                      {CONFIDENCE_LABELS[level]}
                    </span>
                    <span className="tabular-nums">{confidenceCounts[level]}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {canCompare ? (
            <GenreFilter selected={genres} onChange={setGenres} layout="wrap" />
          ) : null}
        </div>
      }
    >
      <div className="space-y-10">
        {canCompare ? (
          <section className="rounded-card border border-line bg-linear-to-b from-surface to-paper/40 p-5 sm:p-7">
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold sm:text-2xl">Your ranking</h2>
            {rankings.length > 0 ? (
              <RankingViewToggle view={view} onChange={setView} />
            ) : null}
          </div>
          {genreFiltering ? (
            <div className="mb-3">
              <FilterMatchCount
                matched={filteredRankings.length}
                total={rankings.length}
                noun="series"
              />
            </div>
          ) : null}
          {view === "tiers" ? (
            <TierListView rankings={filteredRankings} />
          ) : (
            <RankedList
              rankings={filteredRankings}
              genresBySeriesId={genresBySeriesId}
              editable
            />
          )}
        </section>
      </div>
    </ControlRail>
  );
}
