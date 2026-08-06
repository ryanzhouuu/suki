import type { AnimeEntryStatus } from "@/lib/constants";
import type { SeriesRef } from "@/lib/library/group";

export type FingerprintStatusCounts = Record<AnimeEntryStatus, number>;

export type NormalizedRanking = {
  seriesId: string;
  rank: number;
  confidence: "low" | "medium" | "high";
  comparisonCount: number;
  uncertainty: number | null;
  rankPercentile: number;
};

export type NormalizedFranchise = {
  id: string;
  title: string;
  animeIds: string[];
  series: SeriesRef | null;
  statusCounts: FingerprintStatusCounts;
  hasCompleted: boolean;
  hasWatching: boolean;
  hasPaused: boolean;
  hasDropped: boolean;
  hasPlanToWatch: boolean;
  isStarted: boolean;
  isPositiveEngagement: boolean;
  isSettled: boolean;
  genres: string[];
  tags: string[];
  formats: string[];
  completedFormats: string[];
  popularity: number | null;
  completedEpisodeTotal: number | null;
  completedEpisodeMetadataComplete: boolean;
  personalScores: number[];
  meanPersonalScore: number | null;
  totalRewatchCount: number;
  hasRewatch: boolean;
  ranking: NormalizedRanking | null;
};

export type NormalizedFingerprintInput = {
  franchises: NormalizedFranchise[];
  rankedFranchises: NormalizedFranchise[];
  rankingCount: number;
};
