import type * as TasteHelpers from "./taste-similarity-helpers";

export { getTasteCompareHighlights } from "./taste-compare-highlights";
export { getTasteMatchProfile } from "./taste-match-profile";
export { getTasteSimilarity } from "./taste-similarity-score";

export type TasteSimilarityResult =
  | {
      status: "ready";
      score: number;
      label: string;
      confidence: "low" | "medium" | "high";
    }
  | {
      status: "unavailable";
      reason: "not_configured" | "insufficient_data" | "not_friends";
    };

export type TasteFormatDifference = {
  format: string;
  viewerCount: number;
  friendCount: number;
  delta: number;
};

export type TasteMatchProfile = {
  similarity: TasteSimilarityResult;
  highlights: TasteHelpers.TasteCompareHighlights;
  sharedGenres: TasteHelpers.SharedGenreStrength[];
  genreDifferences: TasteHelpers.TasteDifference[];
  formatDifferences: TasteFormatDifference[];
  viewerLovedFriendUnwatched: TasteHelpers.LovedDiscoveryItem[];
  friendLovedViewerUnwatched: TasteHelpers.LovedDiscoveryItem[];
  sharedPlanToWatch: TasteHelpers.SharedWatchlistItem[];
};

export type {
  LovedDiscoveryItem,
  SeriesHighlight,
  SharedGenreStrength,
  SharedWatchlistItem,
  TasteCompareHighlights,
  TasteDifference,
} from "./taste-similarity-helpers";
