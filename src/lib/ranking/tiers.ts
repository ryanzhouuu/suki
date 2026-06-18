import type { Tables } from "@/types/database";

type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

/** Fixed tier labels, best → worst. */
export const TIERS = ["S", "A", "B", "C", "D"] as const;

export type Tier = (typeof TIERS)[number];

/**
 * Tier floors expressed as **z-scores** — standard deviations above/below the
 * user's own mean score — rather than absolute score thresholds. Bradley-Terry
 * score spread varies widely between users (a few decisive comparisons produce a
 * very wide spread; a thin ranking barely separates at all), so absolute bands
 * can't fit everyone. Normalizing per user keeps all five tiers meaningful
 * regardless of spread, and an undifferentiated ranking (zero spread) collapses
 * to all-B instead of looking falsely confident.
 *
 * Bands are symmetric around the mean: roughly S/D ≈ top/bottom 16%,
 * A/C the next ~22% each, B the central ~24% for a normal-ish distribution.
 */
export const TIER_ZSCORE_FLOORS: Record<Exclude<Tier, "D">, number> = {
  S: 1.0,
  A: 0.3,
  B: -0.3,
  C: -1.0,
};

export function tierForZScore(z: number): Tier {
  if (z >= TIER_ZSCORE_FLOORS.S) return "S";
  if (z >= TIER_ZSCORE_FLOORS.A) return "A";
  if (z >= TIER_ZSCORE_FLOORS.B) return "B";
  if (z >= TIER_ZSCORE_FLOORS.C) return "C";
  return "D";
}

export type TierGroup = {
  tier: Tier;
  rows: RankedSeriesRow[];
};

/**
 * Bucket a single user's ranked series into the five fixed tiers using
 * per-user z-score bands (see {@link TIER_ZSCORE_FLOORS}). Always returns all
 * five groups in S→D order (empty ones included), and preserves the incoming
 * rank order within each tier.
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

  const scores = ordered.map((row) => row.score);
  const mean =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  const variance =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) /
        scores.length
      : 0;
  const std = Math.sqrt(variance);

  for (const row of ordered) {
    const z = std > 0 ? (row.score - mean) / std : 0;
    groups[tierForZScore(z)].push(row);
  }

  return TIERS.map((tier) => ({ tier, rows: groups[tier] }));
}
