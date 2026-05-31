export const RECOMMENDATION_ALGORITHM_VERSION = "embedding_v1";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export const SIMILARITY_WEIGHT = 0.75;
export const RERANK_WEIGHT = 0.25;

export const VECTOR_CANDIDATE_LIMIT = 50;
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
} as const;

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES];
