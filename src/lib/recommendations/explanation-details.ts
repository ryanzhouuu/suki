import type { Json } from "@/types/database";

import type { RecommendationExplanationDetails } from "./types";

export function parseExplanationDetails(
  value: Json | null | undefined,
  fallbackExplanation: string,
): RecommendationExplanationDetails {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return {
      primaryReason:
        typeof obj.primaryReason === "string"
          ? obj.primaryReason
          : fallbackExplanation,
      secondarySignals: Array.isArray(obj.secondarySignals)
        ? obj.secondarySignals.filter((item): item is string => typeof item === "string")
        : [],
      matchedGenres: Array.isArray(obj.matchedGenres)
        ? obj.matchedGenres.filter((item): item is string => typeof item === "string")
        : [],
      matchedRequest:
        obj.matchedRequest && typeof obj.matchedRequest === "object"
          ? (obj.matchedRequest as RecommendationExplanationDetails["matchedRequest"])
          : undefined,
      anchorTitles: Array.isArray(obj.anchorTitles)
        ? obj.anchorTitles.filter((item): item is string => typeof item === "string")
        : [],
      badges: Array.isArray(obj.badges)
        ? (obj.badges as RecommendationExplanationDetails["badges"])
        : [],
    };
  }

  return {
    primaryReason: fallbackExplanation,
    secondarySignals: [],
    matchedGenres: [],
    anchorTitles: [],
    badges: [],
  };
}
