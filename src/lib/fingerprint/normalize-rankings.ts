import type { FingerprintRanking } from "./types";
import type { NormalizedRanking } from "./normalize-types";
import { compareStrings } from "./normalize-metadata";

const CONFIDENCE_ORDER: Record<NormalizedRanking["confidence"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function compareRankings(a: FingerprintRanking, b: FingerprintRanking): number {
  const aComparisons = Number.isFinite(a.comparison_count)
    ? a.comparison_count
    : 0;
  const bComparisons = Number.isFinite(b.comparison_count)
    ? b.comparison_count
    : 0;
  const aScore = Number.isFinite(a.score) ? a.score : 0;
  const bScore = Number.isFinite(b.score) ? b.score : 0;
  return (
    a.rank - b.rank ||
    CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] ||
    bComparisons - aComparisons ||
    bScore - aScore ||
    (a.uncertainty ?? Number.POSITIVE_INFINITY) -
      (b.uncertainty ?? Number.POSITIVE_INFINITY) ||
    compareStrings(a.algorithm_version, b.algorithm_version) ||
    compareStrings(a.series_id, b.series_id)
  );
}

export function normalizeRankings(
  rankings: readonly FingerprintRanking[],
): NormalizedRanking[] {
  const usable = rankings
    .filter(
      (ranking) =>
        typeof ranking.series_id === "string" &&
        ranking.series_id.length > 0 &&
        Number.isFinite(ranking.rank) &&
        ranking.rank > 0 &&
        ["low", "medium", "high"].includes(ranking.confidence),
    )
    .sort(compareRankings);

  const unique = new Map<string, FingerprintRanking>();
  for (const ranking of usable) {
    if (!unique.has(ranking.series_id)) unique.set(ranking.series_id, ranking);
  }

  const deduped = [...unique.values()].sort(compareRankings);
  const total = deduped.length;
  return deduped.map((ranking, index) => ({
    seriesId: ranking.series_id,
    rank: ranking.rank,
    confidence: ranking.confidence,
    comparisonCount:
      typeof ranking.comparison_count === "number" &&
      Number.isFinite(ranking.comparison_count)
        ? Math.max(0, ranking.comparison_count)
        : 0,
    uncertainty:
      typeof ranking.uncertainty === "number" &&
      Number.isFinite(ranking.uncertainty) &&
      ranking.uncertainty >= 0
        ? ranking.uncertainty
        : null,
    rankPercentile: Math.max(
      0,
      Math.min(1, total <= 1 ? 1 : 1 - index / Math.max(1, total - 1)),
    ),
  }));
}
