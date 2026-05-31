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

export type ScoredRecommendation = {
  anime: Tables<"anime">;
  seriesId: string | null;
  similarityScore: number;
  rerankScore: number;
  finalScore: number;
  reasonCodes: ReasonCode[];
  explanation: string;
};

export type RecommendationRow = Tables<"recommendations"> & {
  anime: Tables<"anime">;
};
