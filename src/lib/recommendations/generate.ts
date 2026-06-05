import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

import { getVectorCandidates } from "./candidates";
import {
  EMBEDDING_MODEL,
  RECOMMENDATION_ALGORITHM_VERSION,
  STORED_RECOMMENDATION_LIMIT,
} from "./constants";
import { getRecommendationExclusions } from "./exclusions";
import { filterCandidatesByRequest } from "./request-filter";
import {
  finalizeRecommendations,
  rerankCandidates,
} from "./rerank";
import {
  EMPTY_REQUEST_PREFS,
  type RecommendationRequestPrefs,
} from "./request-prefs";
import { buildRunInputHash } from "./run-input-hash";
import { sampleAdventurous } from "./sampler";
import { buildTasteProfile } from "./taste-profile";
import { upsertUserTasteEmbedding } from "./taste-embedding";
import { isEmbeddingConfigured } from "./embedding-provider";
import { parseExplanationDetails } from "./explanation-details";
import type { ScoredRecommendation } from "./types";

export type GenerateRecommendationsOptions = {
  force?: boolean;
  prefs?: RecommendationRequestPrefs;
  samplingSeed?: string;
};

export type GenerateRecommendationsResult = {
  runId: string;
  recommendations: ScoredRecommendation[];
  fromCache: boolean;
};

export async function generateRecommendations(
  userId: string,
  options?: GenerateRecommendationsOptions,
): Promise<GenerateRecommendationsResult> {
  if (!isEmbeddingConfigured()) {
    throw new Error(
      "Recommendations require OPENAI_API_KEY in the server environment.",
    );
  }

  const prefs = options?.prefs ?? EMPTY_REQUEST_PREFS;
  const samplingSeed = options?.samplingSeed ?? randomUUID();
  const profile = await buildTasteProfile(userId);
  const runInputHash = buildRunInputHash(profile.inputHash, prefs);

  const admin = createAdminClient();

  if (!options?.force) {
    const { data: latestRun } = await admin
      .from("recommendation_runs")
      .select("id, input_hash")
      .eq("user_id", userId)
      .eq("run_kind", "personal")
      .eq("algorithm_version", RECOMMENDATION_ALGORITHM_VERSION)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun?.input_hash === runInputHash) {
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

  await upsertUserTasteEmbedding(profile);

  const exclusions = await getRecommendationExclusions(userId);
  const candidates = await getVectorCandidates(profile, exclusions);

  const filtered = filterCandidatesByRequest(candidates, prefs);
  const pool = filtered.length > 0 ? filtered : candidates;

  const scored = rerankCandidates(profile, pool, prefs);
  const sampled = sampleAdventurous(
    scored,
    prefs,
    samplingSeed,
    STORED_RECOMMENDATION_LIMIT,
  );

  const final = finalizeRecommendations(profile, sampled, prefs, {
    preserveOrder: true,
  });

  const { data: run, error: runError } = await admin
    .from("recommendation_runs")
    .insert({
      user_id: userId,
      run_kind: "personal",
      algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
      embedding_model: EMBEDDING_MODEL,
      input_hash: runInputHash,
      request_prefs: prefs,
      sampling_seed: samplingSeed,
    })
    .select("id")
    .single();

  if (runError || !run) {
    throw new Error(runError?.message ?? "Failed to create recommendation run");
  }

  if (final.length > 0) {
    const { error: insertError } = await admin.from("recommendations").insert(
      final.map((rec) => ({
        run_id: run.id,
        user_id: userId,
        anime_id: rec.anime.id,
        series_id: rec.seriesId,
        similarity_score: rec.similarityScore,
        rerank_score: rec.rerankScore,
        final_score: rec.finalScore,
        reason_codes: rec.reasonCodes,
        explanation: rec.explanation,
        explanation_details: rec.explanationDetails,
        algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
      })),
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return {
    runId: run.id,
    recommendations: final,
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
    explanationDetails: parseExplanationDetails(
      row.explanation_details,
      row.explanation,
    ),
  }));
}
