import type { CountSignal } from "./fact-types";
import type { NormalizedFranchise } from "./normalize";

export const CONFIDENCE_WEIGHTS = {
  low: 0.35,
  medium: 0.7,
  high: 1,
} as const;

export const RANK_POSITION_DECAY = 0.5;

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareFranchises(
  a: NormalizedFranchise,
  b: NormalizedFranchise,
): number {
  return compareStrings(a.id, b.id);
}

export function countSignals(
  franchises: NormalizedFranchise[],
  valuesFor: (franchise: NormalizedFranchise) => readonly string[],
  weightedBy?: (franchise: NormalizedFranchise) => number,
): CountSignal[] {
  const counts = new Map<string, number>();
  const weightedCounts = new Map<string, number>();

  for (const franchise of franchises) {
    const values = new Set(valuesFor(franchise));
    const weight = weightedBy?.(franchise) ?? 1;
    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
      weightedCounts.set(value, (weightedCounts.get(value) ?? 0) + weight);
    }
  }

  const denominator = franchises.length;
  const weightedDenominator = [...weightedCounts.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  return [...counts.keys()]
    .map((key) => {
      const count = counts.get(key) ?? 0;
      const weightedCount = weightedCounts.get(key) ?? 0;
      return {
        key,
        count,
        share: denominator > 0 ? count / denominator : 0,
        weightedCount,
        weightedShare:
          weightedDenominator > 0 ? weightedCount / weightedDenominator : 0,
      };
    })
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.weightedCount - a.weightedCount ||
        compareStrings(a.key, b.key),
    );
}

export function confidenceWeight(
  confidence: NonNullable<NormalizedFranchise["ranking"]>["confidence"],
): number {
  return CONFIDENCE_WEIGHTS[confidence];
}

export function rankPositionWeight(rank: number, totalRanked: number): number {
  if (!Number.isFinite(rank) || rank <= 0 || totalRanked <= 0) return 0;
  return 1 / rank ** RANK_POSITION_DECAY;
}

export function rankingSignalWeight(
  franchise: NormalizedFranchise,
  totalRanked: number,
): number {
  if (!franchise.ranking) return 0;
  return (
    rankPositionWeight(franchise.ranking.rank, totalRanked) *
    confidenceWeight(franchise.ranking.confidence)
  );
}

export function rankSupport(
  franchises: NormalizedFranchise[],
  valuesFor: (franchise: NormalizedFranchise) => readonly string[],
  totalRanked: number,
): Map<string, number> {
  const support = new Map<string, number>();
  for (const franchise of franchises) {
    const weight = rankingSignalWeight(franchise, totalRanked);
    for (const value of new Set(valuesFor(franchise))) {
      support.set(value, (support.get(value) ?? 0) + weight);
    }
  }
  return support;
}
