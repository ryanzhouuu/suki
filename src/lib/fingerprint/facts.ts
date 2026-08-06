import type { CountSignal, FingerprintFacts } from "./fact-types";
import {
  compareFranchises,
  countSignals,
  rankSupport,
  rankingSignalWeight,
} from "./fact-signals";
import type { NormalizedFranchise } from "./normalize";

export type { CountSignal, EpisodeSignal, FingerprintFacts } from "./fact-types";
export {
  CONFIDENCE_WEIGHTS,
  RANK_POSITION_DECAY,
  confidenceWeight,
  rankPositionWeight,
  rankingSignalWeight,
} from "./fact-signals";

export const TOP_RANK_SHARE = 0.3;

function sortedByRank(franchises: NormalizedFranchise[]): NormalizedFranchise[] {
  return [...franchises].sort(
    (a, b) =>
      (a.ranking?.rank ?? Number.POSITIVE_INFINITY) -
        (b.ranking?.rank ?? Number.POSITIVE_INFINITY) ||
      compareFranchises(a, b),
  );
}

export function deriveFingerprintFacts(
  franchises: readonly NormalizedFranchise[],
  rankingCount: number,
): FingerprintFacts {
  const ordered = [...franchises].sort(compareFranchises);
  const startedFranchises = ordered.filter((item) => item.isStarted);
  const positiveFranchises = ordered.filter((item) => item.isPositiveEngagement);
  const settledFranchises = ordered.filter((item) => item.isSettled);
  const completedFranchises = ordered.filter((item) => item.hasCompleted);
  const activeFranchises = ordered.filter((item) => item.hasWatching);
  const pausedFranchises = ordered.filter((item) => item.hasPaused);
  const droppedFranchises = ordered.filter((item) => item.hasDropped);
  const rankedFranchises = sortedByRank(
    ordered.filter((item) => item.ranking !== null),
  );
  const confidentlyRankedFranchises = rankedFranchises.filter(
    (item) =>
      item.ranking?.confidence === "medium" ||
      item.ranking?.confidence === "high",
  );
  const topRankCutoff = Math.max(
    1,
    Math.ceil(rankedFranchises.length * TOP_RANK_SHARE),
  );
  const topRankedFranchises = rankedFranchises.filter(
    (item) => (item.ranking?.rank ?? Infinity) <= topRankCutoff,
  );
  const rankedPositive = rankedFranchises.filter(
    (item) => item.isPositiveEngagement,
  );
  const completedEpisodeSignals = completedFranchises
    .filter(
      (item) =>
        item.completedEpisodeMetadataComplete &&
        item.completedEpisodeTotal !== null,
    )
    .map((franchise) => ({
      franchise,
      episodes: franchise.completedEpisodeTotal as number,
    }))
    .sort(
      (a, b) =>
        b.episodes - a.episodes || compareFranchises(a.franchise, b.franchise),
    );
  const scoredFranchises = startedFranchises.filter(
    (item) => item.meanPersonalScore !== null,
  );
  const knownPopularityFavorites = confidentlyRankedFranchises
    .filter((item) => item.popularity !== null)
    .map((franchise) => ({
      franchise,
      popularity: franchise.popularity as number,
    }))
    .sort(
      (a, b) =>
        (a.franchise.ranking?.rank ?? Infinity) -
          (b.franchise.ranking?.rank ?? Infinity) ||
        compareFranchises(a.franchise, b.franchise),
    );
  const completedFormatSignals = countSignals(
    completedFranchises,
    (item) => item.completedFormats,
  );
  const lowPopularityCount = knownPopularityFavorites.filter(
    (item) => item.popularity <= 10_000,
  ).length;
  const highPopularityCount = knownPopularityFavorites.filter(
    (item) => item.popularity >= 100_000,
  ).length;

  return {
    franchises: ordered,
    sourceSeriesCount: ordered.length,
    startedFranchises,
    positiveFranchises,
    settledFranchises,
    completedFranchises,
    activeFranchises,
    pausedFranchises,
    droppedFranchises,
    startedCount: startedFranchises.length,
    settledCount: settledFranchises.length,
    completedCount: completedFranchises.length,
    activeCount: activeFranchises.length,
    pausedCount: pausedFranchises.length,
    droppedCount: droppedFranchises.length,
    completionRate:
      settledFranchises.length > 0
        ? completedFranchises.filter((item) => item.isSettled).length /
          settledFranchises.length
        : null,
    dropShare:
      startedFranchises.length > 0
        ? droppedFranchises.length / startedFranchises.length
        : 0,
    pauseDropShare:
      startedFranchises.length > 0
        ? startedFranchises.filter((item) => item.hasPaused || item.hasDropped)
            .length / startedFranchises.length
        : 0,
    genreSignals: countSignals(positiveFranchises, (item) => item.genres),
    tagSignals: countSignals(positiveFranchises, (item) => item.tags),
    formatSignals: countSignals(positiveFranchises, (item) => item.formats),
    completedFormatSignals,
    rankedFranchises,
    confidentlyRankedFranchises,
    topRankedFranchises,
    rankedCount: rankedFranchises.length,
    confidentRankedCount: confidentlyRankedFranchises.length,
    confidentRankShare:
      rankedFranchises.length > 0
        ? confidentlyRankedFranchises.length / rankedFranchises.length
        : 0,
    rankWeightTotal: rankedFranchises.reduce(
      (sum, item) => sum + rankingSignalWeight(item, rankingCount),
      0,
    ),
    rankedGenreSupport: rankSupport(
      rankedPositive,
      (item) => item.genres,
      rankingCount,
    ),
    rankedTagSupport: rankSupport(
      rankedPositive,
      (item) => item.tags,
      rankingCount,
    ),
    rankedPositiveCount: rankedPositive.length,
    completedEpisodeSignals,
    shortEpisodeSignals: completedEpisodeSignals.filter(
      ({ episodes }) => episodes <= 13,
    ),
    longEpisodeSignals: completedEpisodeSignals.filter(
      ({ episodes }) => episodes >= 40,
    ),
    completedEpisodeTotal: completedEpisodeSignals.reduce(
      (sum, item) => sum + item.episodes,
      0,
    ),
    completedMovieFranchises: completedFranchises.filter((item) =>
      item.completedFormats.includes("MOVIE"),
    ),
    knownCompletedFormatCount: completedFranchises.filter(
      (item) => item.completedFormats.length > 0,
    ).length,
    totalRewatchCount: ordered.reduce(
      (sum, item) => sum + item.totalRewatchCount,
      0,
    ),
    rewatchedFranchiseCount: ordered.filter((item) => item.hasRewatch).length,
    scoredFranchises,
    meanPersonalScore:
      scoredFranchises.length > 0
        ? scoredFranchises.reduce(
            (sum, item) => sum + (item.meanPersonalScore ?? 0),
            0,
          ) / scoredFranchises.length
        : null,
    knownPopularityFavorites,
    lowPopularityFavoriteShare:
      knownPopularityFavorites.length > 0
        ? lowPopularityCount / knownPopularityFavorites.length
        : 0,
    highPopularityFavoriteShare:
      knownPopularityFavorites.length > 0
        ? highPopularityCount / knownPopularityFavorites.length
        : 0,
  };
}

export function signalFor(
  signals: readonly CountSignal[],
  key: string,
): CountSignal | undefined {
  return signals.find((signal) => signal.key === key);
}

export function hasMeaningfulShare(value: number, denominator: number): boolean {
  return Number.isFinite(denominator) && denominator > 0 && value > 0;
}
