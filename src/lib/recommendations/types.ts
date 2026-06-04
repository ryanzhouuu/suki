import type { Tables } from "@/types/database";

import type { ReasonCode } from "./constants";

export type EmbeddingProvider = {
  model: string;
  dimensions: number;
  embed(inputs: string[]): Promise<number[][]>;
};

export type TasteProfileSignals = {
  topRankedSeries: { id: string; title: string; rank: number }[];
  comparisonWinners: string[];
  comparisonLosers: string[];
  completedTitles: string[];
  watchingTitles: string[];
  droppedTitles: string[];
  topGenres: string[];
  topFormats: string[];
  topSources: string[];
  avoidGenres: string[];
};

export type TasteProfile = {
  userId: string;
  inputHash: string;
  profileText: string;
  signals: TasteProfileSignals;
};

export type CandidateAnime = Tables<"anime"> & {
  seriesId: string | null;
  similarityScore: number;
};

export type RecommendationExplanationBadge =
  | "strong_match"
  | "genre_match"
  | "request_match"
  | "community_score"
  | "popular"
  | "diverse_pick"
  | "wildcard_pick";

export type RecommendationExplanationDetails = {
  primaryReason: string;
  secondarySignals: string[];
  matchedGenres: string[];
  matchedRequest?: {
    genres?: string[];
    format?: string;
    lengthBucket?: string;
  };
  anchorTitles: string[];
  badges: RecommendationExplanationBadge[];
};

export type ScoredRecommendation = {
  anime: Tables<"anime">;
  seriesId: string | null;
  similarityScore: number;
  rerankScore: number;
  finalScore: number;
  reasonCodes: ReasonCode[];
  explanation: string;
  explanationDetails: RecommendationExplanationDetails;
};

export type RecommendationLibraryEntry = {
  id: string;
  status: Tables<"user_anime_entries">["status"];
  progress_episodes: number;
};

export type RecommendationRow = Tables<"recommendations"> & {
  anime: Tables<"anime">;
  libraryEntry?: RecommendationLibraryEntry | null;
  parsedExplanationDetails?: RecommendationExplanationDetails;
};
