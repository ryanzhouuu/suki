import type { NormalizedFranchise } from "./normalize";

export type CountSignal = {
  key: string;
  count: number;
  share: number;
  weightedCount: number;
  weightedShare: number;
};

export type EpisodeSignal = {
  franchise: NormalizedFranchise;
  episodes: number;
};

export type PopularitySignal = {
  franchise: NormalizedFranchise;
  popularity: number;
};

export type FingerprintFacts = {
  franchises: NormalizedFranchise[];
  sourceSeriesCount: number;
  startedFranchises: NormalizedFranchise[];
  positiveFranchises: NormalizedFranchise[];
  settledFranchises: NormalizedFranchise[];
  completedFranchises: NormalizedFranchise[];
  activeFranchises: NormalizedFranchise[];
  pausedFranchises: NormalizedFranchise[];
  droppedFranchises: NormalizedFranchise[];
  startedCount: number;
  settledCount: number;
  completedCount: number;
  activeCount: number;
  pausedCount: number;
  droppedCount: number;
  completionRate: number | null;
  dropShare: number;
  pauseDropShare: number;
  genreSignals: CountSignal[];
  tagSignals: CountSignal[];
  formatSignals: CountSignal[];
  completedFormatSignals: CountSignal[];
  rankedFranchises: NormalizedFranchise[];
  confidentlyRankedFranchises: NormalizedFranchise[];
  topRankedFranchises: NormalizedFranchise[];
  rankedCount: number;
  confidentRankedCount: number;
  confidentRankShare: number;
  rankWeightTotal: number;
  rankedGenreSupport: Map<string, number>;
  rankedTagSupport: Map<string, number>;
  rankedPositiveCount: number;
  completedEpisodeSignals: EpisodeSignal[];
  shortEpisodeSignals: EpisodeSignal[];
  longEpisodeSignals: EpisodeSignal[];
  completedEpisodeTotal: number;
  completedMovieFranchises: NormalizedFranchise[];
  knownCompletedFormatCount: number;
  totalRewatchCount: number;
  rewatchedFranchiseCount: number;
  scoredFranchises: NormalizedFranchise[];
  meanPersonalScore: number | null;
  knownPopularityFavorites: PopularitySignal[];
  lowPopularityFavoriteShare: number;
  highPopularityFavoriteShare: number;
};
