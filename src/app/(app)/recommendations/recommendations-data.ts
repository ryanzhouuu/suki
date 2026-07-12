import "server-only";

import { runResilientOperation } from "@/lib/resilience/operation";
import { getRecommendationPoolStats } from "@/lib/recommendations/pool-stats";

export function loadRecommendationPoolStats(userId: string) {
  return runResilientOperation(
    {
      route: "/recommendations",
      operation: "load_recommendation_pool_stats",
      dependency: "supabase",
      userId,
    },
    () => getRecommendationPoolStats(userId),
  );
}

export function reportRecommendationConfiguration(userId: string) {
  return runResilientOperation(
    {
      route: "/recommendations",
      operation: "check_embedding_configuration",
      dependency: "openai",
      userId,
    },
    () => {
      throw new Error("OPENAI_API_KEY is not set.");
    },
  );
}
