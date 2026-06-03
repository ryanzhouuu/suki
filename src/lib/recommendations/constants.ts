export const RECOMMENDATION_ALGORITHM_VERSION = "embedding_v2_request_prefs";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export const SIMILARITY_WEIGHT = 0.6;
export const RERANK_WEIGHT = 0.2;
export const REQUEST_MATCH_WEIGHT = 0.2;

export const VECTOR_CANDIDATE_LIMIT = 200;
export const STORED_RECOMMENDATION_LIMIT = 20;

export const REASON_CODES = {
  semanticMatch: "semantic_match",
  topGenre: "top_genre",
  topFormat: "top_format",
  topSource: "top_source",
  rankedSeriesAffinity: "ranked_series_affinity",
  highCommunityScore: "high_community_score",
  popular: "popular",
  droppedGenrePenalty: "dropped_genre_penalty",
  requestGenreMatch: "request_genre_match",
  requestLengthMatch: "request_length_match",
  requestFormatMatch: "request_format_match",
  diversePick: "diverse_pick",
  wildcardPick: "wildcard_pick",
} as const;

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES];
