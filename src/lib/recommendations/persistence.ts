import type { TablesInsert } from "@/types/database";

import type { ScoredRecommendation } from "./types";

export function buildRecommendationInsertRows(
  recommendations: ScoredRecommendation[],
  runId: string,
  userId: string,
  algorithmVersion: string,
): TablesInsert<"recommendations">[] {
  return recommendations.map((rec, index) => ({
    run_id: runId,
    user_id: userId,
    anime_id: rec.anime.id,
    series_id: rec.seriesId,
    similarity_score: rec.similarityScore,
    rerank_score: rec.rerankScore,
    final_score: rec.finalScore,
    reason_codes: rec.reasonCodes,
    explanation: rec.explanation,
    explanation_details: rec.explanationDetails,
    algorithm_version: algorithmVersion,
    position: index,
  }));
}
