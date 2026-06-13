import { AnimePoster } from "@/components/anime/anime-poster";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import { type Tier, groupRankingsIntoTiers } from "@/lib/ranking/tiers";
import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

type TierListViewProps = {
  rankings: RankedSeriesRow[];
};

/** Tier badge styling, S (strongest) → D (faintest). */
const TIER_STYLES: Record<Tier, string> = {
  S: "bg-accent text-on-accent",
  A: "bg-success/90 text-on-accent",
  B: "bg-accent-soft text-accent",
  C: "bg-surface-2 text-muted",
  D: "bg-surface-2 text-faint",
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
    <div className="overflow-hidden rounded-card border border-line">
      {tiers.map(({ tier, rows }) => (
        <div
          key={tier}
          className="flex items-stretch border-b border-line last:border-b-0"
        >
          <div
            className={`flex w-14 shrink-0 items-center justify-center font-display text-2xl font-semibold ${TIER_STYLES[tier]}`}
          >
            {tier}
          </div>
          <div className="min-h-[88px] flex-1 bg-surface p-2.5">
            {rows.length === 0 ? (
              <div className="flex h-full min-h-[68px] items-center text-sm text-faint">
                —
              </div>
            ) : (
              <ul className="flex flex-wrap gap-2">
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
                      className={lowConfidence ? "opacity-50" : undefined}
                    >
                      <AnimePoster
                        src={series.cover_image_url}
                        alt={series.canonical_title}
                        size="sm"
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
