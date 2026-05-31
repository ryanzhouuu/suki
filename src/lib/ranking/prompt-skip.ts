import type { ResolvedComparison } from "./preference-graph";

/** Rank 1 = best. Skip pairs far apart on the list; use one-hop wins only (no long chains). */
export const RANK_GAP_SKIP_THRESHOLD = 4;
/** Wider gap required when either series barely has comparison data. */
export const RANK_GAP_SKIP_WHEN_UNPLACED = 5;
/** Minimum list distance before a single intermediate win can skip a prompt. */
export const RANK_GAP_BRIDGE_MIN = 3;

export type RankContext = {
  rankBySeriesId: Map<string, number>;
  comparisonCountBySeriesId: Map<string, number>;
};

/**
 * True when a direct comparison already established `betterId` ≻ `midId`
 * and ranks place `midId` between `betterId` and `worseId` (better = lower rank #).
 */
export function hasOneHopBridge(
  comparisons: ResolvedComparison[],
  betterId: string,
  worseId: string,
  rankBySeriesId: Map<string, number>,
): boolean {
  const rankBetter = rankBySeriesId.get(betterId);
  const rankWorse = rankBySeriesId.get(worseId);
  if (rankBetter === undefined || rankWorse === undefined) return false;
  if (rankBetter >= rankWorse) return false;

  for (const { winnerId, loserId } of comparisons) {
    if (winnerId !== betterId) continue;
    const rankMid = rankBySeriesId.get(loserId);
    if (rankMid === undefined) continue;
    if (rankBetter < rankMid && rankMid < rankWorse) return true;
  }

  return false;
}

/**
 * Skip a prompt when list distance makes it redundant, optionally with one direct win
 * bridging the gap — not full transitivity.
 */
export function shouldSkipComparisonByRankDistance(
  seriesIdA: string,
  seriesIdB: string,
  comparisons: ResolvedComparison[],
  ctx: RankContext,
): boolean {
  const rankA = ctx.rankBySeriesId.get(seriesIdA);
  const rankB = ctx.rankBySeriesId.get(seriesIdB);
  if (rankA === undefined || rankB === undefined) return false;

  const gap = Math.abs(rankA - rankB);
  const countA = ctx.comparisonCountBySeriesId.get(seriesIdA) ?? 0;
  const countB = ctx.comparisonCountBySeriesId.get(seriesIdB) ?? 0;
  const minCount = Math.min(countA, countB);

  const distanceThreshold =
    minCount < 2 ? RANK_GAP_SKIP_WHEN_UNPLACED : RANK_GAP_SKIP_THRESHOLD;

  if (gap >= distanceThreshold) return true;

  if (gap >= RANK_GAP_BRIDGE_MIN) {
    if (rankA < rankB && hasOneHopBridge(comparisons, seriesIdA, seriesIdB, ctx.rankBySeriesId)) {
      return true;
    }
    if (rankB < rankA && hasOneHopBridge(comparisons, seriesIdB, seriesIdA, ctx.rankBySeriesId)) {
      return true;
    }
  }

  return false;
}
