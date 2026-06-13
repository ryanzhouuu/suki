import { AnimePoster } from "@/components/anime/anime-poster";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import { groupRankingsIntoTiers } from "@/lib/ranking/tiers";
import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

type TierListViewProps = {
  rankings: RankedSeriesRow[];
};

export function TierListView({ rankings }: TierListViewProps) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
        <p className="text-sm text-muted">
          Complete anime and compare series to build your tier list.
        </p>
      </div>
    );
  }

  const tiers = groupRankingsIntoTiers(rankings);

  return (
    <div className="tier-board">
      {tiers.map(({ tier, rows }, index) => (
        <div
          key={tier}
          data-tier={tier}
          className="tier-row animate-rise"
          style={{ animationDelay: `${index * 55}ms` }}
        >
          <div className="tier-label">
            <span className="tier-label__letter">{tier}</span>
            <span className="tier-label__count">{rows.length}</span>
          </div>
          <div className="tier-strip">
            {rows.length === 0 ? (
              <span className="tier-strip__empty">empty</span>
            ) : (
              <ul className="tier-strip__covers">
                {rows.map((row) => {
                  const series = row.series;
                  if (!series) return null;
                  const lowConfidence = row.confidence === "low";
                  return (
                    <li
                      key={row.id}
                      title={
                        lowConfidence
                          ? `${series.canonical_title} · ${CONFIDENCE_LABELS.low}`
                          : series.canonical_title
                      }
                    >
                      <AnimePoster
                        src={series.cover_image_url}
                        alt={series.canonical_title}
                        size="sm"
                        className={`tier-strip__cover${
                          lowConfidence ? " tier-strip__cover--low" : ""
                        }`}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
