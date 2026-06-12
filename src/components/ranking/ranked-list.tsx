import { AnimePoster } from "@/components/anime/anime-poster";
import { RerankButton } from "@/components/ranking/rerank-button";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

type RankedListProps = {
  rankings: RankedSeriesRow[];
  genresBySeriesId?: Record<string, string[]>;
};

export function RankedList({ rankings, genresBySeriesId }: RankedListProps) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
        <p className="text-sm text-muted">
          Complete anime and compare series to build your ranking.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {rankings.map((row) => {
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
            <RerankButton
              seriesId={row.series_id}
              title={series.canonical_title}
            />
          </li>
        );
      })}
    </ol>
  );
}
