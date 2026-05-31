import { createAdminClient } from "@/lib/supabase/admin";

import {
  EMBEDDING_MODEL,
  RECOMMENDATION_ALGORITHM_VERSION,
  STORED_RECOMMENDATION_LIMIT,
} from "./constants";
import { getVectorCandidates } from "./candidates";
import { getRecommendationExclusions } from "./exclusions";
import {
  finalizeRecommendations,
  rerankCandidates,
} from "./rerank";
import { backfillMissingAnimeEmbeddings } from "./sync-anime-embedding";
import { buildTasteProfile } from "./taste-profile";
import { upsertUserTasteEmbedding } from "./taste-embedding";
import { isEmbeddingConfigured } from "./embedding-provider";
import type { ScoredRecommendation } from "./types";

export type GenerateRecommendationsResult = {
  runId: string;
  recommendations: ScoredRecommendation[];
  fromCache: boolean;
};

export async function generateRecommendations(
  userId: string,
  options?: { force?: boolean },
): Promise<GenerateRecommendationsResult> {
  if (!isEmbeddingConfigured()) {
    throw new Error(
      "Recommendations require OPENAI_API_KEY in the server environment.",
    );
  }

  const profile = await buildTasteProfile(userId);

  const admin = createAdminClient();

  if (!options?.force) {
    const { data: latestRun } = await admin
      .from("recommendation_runs")
      .select("id, input_hash")
      .eq("user_id", userId)
      .eq("algorithm_version", RECOMMENDATION_ALGORITHM_VERSION)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun?.input_hash === profile.inputHash) {
      const cached = await loadRecommendationsForRun(latestRun.id);
      if (cached.length > 0) {
        return {
          runId: latestRun.id,
          recommendations: cached,
          fromCache: true,
        };
      }
    }
  }

  await backfillMissingAnimeEmbeddings(120);
  await upsertUserTasteEmbedding(profile);

  const exclusions = await getRecommendationExclusions(userId);
  const candidates = await getVectorCandidates(profile, exclusions);

  const scored = finalizeRecommendations(
    profile,
    rerankCandidates(profile, candidates),
  ).slice(0, STORED_RECOMMENDATION_LIMIT);

  const { data: run, error: runError } = await admin
    .from("recommendation_runs")
    .insert({
      user_id: userId,
      algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
      embedding_model: EMBEDDING_MODEL,
      input_hash: profile.inputHash,
    })
    .select("id")
    .single();

  if (runError || !run) {
    throw new Error(runError?.message ?? "Failed to create recommendation run");
  }

  if (scored.length > 0) {
    const { error: insertError } = await admin.from("recommendations").insert(
      scored.map((rec) => ({
        run_id: run.id,
        user_id: userId,
        anime_id: rec.anime.id,
        series_id: rec.seriesId,
        similarity_score: rec.similarityScore,
        rerank_score: rec.rerankScore,
        final_score: rec.finalScore,
        reason_codes: rec.reasonCodes,
        explanation: rec.explanation,
        algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
      })),
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return {
    runId: run.id,
    recommendations: scored,
    fromCache: false,
  };
}

async function loadRecommendationsForRun(
  runId: string,
): Promise<ScoredRecommendation[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recommendations")
    .select("*, anime(*)")
    .eq("run_id", runId)
    .order("final_score", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    anime: row.anime as ScoredRecommendation["anime"],
    seriesId: row.series_id,
    similarityScore: Number(row.similarity_score),
    rerankScore: Number(row.rerank_score),
    finalScore: Number(row.final_score),
    reasonCodes: row.reason_codes as ScoredRecommendation["reasonCodes"],
    explanation: row.explanation,
  }));
}
