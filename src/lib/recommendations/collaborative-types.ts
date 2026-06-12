import type { RecommendationRequestPrefs } from "./request-prefs";

export const COLLABORATIVE_RECOMMENDATION_MODES = [
  "best_shared_match",
  "short_watch",
  "new_to_both",
  "based_on_overlap",
  "surprise_us",
] as const;

export type CollaborativeRecommendationMode =
  (typeof COLLABORATIVE_RECOMMENDATION_MODES)[number];

const MODE_SET = new Set<string>(COLLABORATIVE_RECOMMENDATION_MODES);

export type CollaborativeRecommendationPrefs = RecommendationRequestPrefs & {
  mode: CollaborativeRecommendationMode;
};

export const DEFAULT_COLLABORATIVE_RECOMMENDATION_PREFS: CollaborativeRecommendationPrefs =
  {
    genres: [],
    lengthBucket: null,
    format: null,
    mood: null,
    adventurousness: "balanced",
    mode: "best_shared_match",
  };

export function isCollaborativeRecommendationMode(
  value: string,
): value is CollaborativeRecommendationMode {
  return MODE_SET.has(value);
}
