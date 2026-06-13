import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

/** Fixed tier labels, best → worst. */
export const TIERS = ["S", "A", "B", "C", "D"] as const;

export type Tier = (typeof TIERS)[number];

/**
 * Elo-score floors for each tier, relative to the 1500 baseline. A score lands
 * in the first (highest) tier whose floor it clears; anything below C's floor
 * is D. Bands are tuned to the observed score spread (real rankings cluster
 * tightly around 1500, roughly 1340–1650) so all five tiers actually fill —
 * symmetric ±25 / ±75 around the baseline.
 */
export const TIER_THRESHOLDS: Record<Exclude<Tier, "D">, number> = {
  S: 1575,
  A: 1525,
  B: 1475,
  C: 1425,
};

export function tierForScore(score: number): Tier {
  if (score >= TIER_THRESHOLDS.S) return "S";
  if (score >= TIER_THRESHOLDS.A) return "A";
  if (score >= TIER_THRESHOLDS.B) return "B";
  if (score >= TIER_THRESHOLDS.C) return "C";
  return "D";
}

export type TierGroup = {
  tier: Tier;
  rows: RankedSeriesRow[];
};

/**
 * Bucket ranked series into the five fixed tiers. Always returns all five
 * groups in S→D order (empty ones included), and preserves the incoming rank
 * order within each tier.
 */
export function groupRankingsIntoTiers(
  rankings: RankedSeriesRow[],
): TierGroup[] {
  const groups: Record<Tier, RankedSeriesRow[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };

  const ordered = [...rankings].sort((a, b) => a.rank - b.rank);
  for (const row of ordered) {
    groups[tierForScore(row.score)].push(row);
  }

  return TIERS.map((tier) => ({ tier, rows: groups[tier] }));
}
