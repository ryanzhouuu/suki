"use client";

import { useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import { RerankButton } from "@/components/ranking/rerank-button";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import type { Tables } from "@/types/database";

const DEFAULT_VISIBLE = 10;

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

type RankedListProps = {
  rankings: RankedSeriesRow[];
  genresBySeriesId?: Record<string, string[]>;
  /** Show the re-rank control. Only the list's owner can re-rank. */
  editable?: boolean;
  /** When set, collapse to the first N rows with a show all/less toggle. */
  collapsible?: boolean;
};

export function RankedList({
  rankings,
  genresBySeriesId,
  editable = false,
  collapsible = false,
}: RankedListProps) {
  const [expanded, setExpanded] = useState(false);

  if (rankings.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
        <p className="text-sm text-muted">
          Complete anime and compare series to build your ranking.
        </p>
      </div>
    );
  }

  const canCollapse = collapsible && rankings.length > DEFAULT_VISIBLE;
  const visibleRankings =
    canCollapse && !expanded ? rankings.slice(0, DEFAULT_VISIBLE) : rankings;

  return (
    <>
    <ol className="space-y-2">
      {visibleRankings.map((row) => {
        const series = row.series;
        if (!series) return null;
        const top = row.rank <= 3;
        return (
          <li
            key={row.id}
            className="group flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2.5 transition-colors hover:border-accent"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold tabular-nums ${
                top
                  ? "bg-accent text-on-accent"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {row.rank}
            </span>
            <AnimePoster
              src={series.cover_image_url}
              alt={series.canonical_title}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">
                {series.canonical_title}
              </p>
              {genresBySeriesId?.[row.series_id]?.length ? (
                <p className="mt-0.5 truncate text-xs text-faint">
                  {genresBySeriesId[row.series_id]!.slice(0, 3).join(" · ")}
                </p>
              ) : null}
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    row.confidence === "high"
                      ? "bg-success"
                      : row.confidence === "medium"
                        ? "bg-accent"
                        : "bg-faint"
                  }`}
                />
                {CONFIDENCE_LABELS[row.confidence]}
              </p>
            </div>
            {editable ? (
              <RerankButton
                seriesId={row.series_id}
                title={series.canonical_title}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
    {canCollapse ? (
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-4 text-sm font-medium text-accent transition-colors hover:underline"
      >
        {expanded ? "Show less" : `Show all ${rankings.length}`}
      </button>
    ) : null}
    </>
  );
}
