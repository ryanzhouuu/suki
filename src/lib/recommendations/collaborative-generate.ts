import { randomUUID } from "node:crypto";

import { getFriendshipBetween } from "@/lib/friends/queries";
import { assertAcceptedFriends } from "@/lib/friends/relationship";
import { createAdminClient } from "@/lib/supabase/admin";

import { getVectorCandidatesForEmbedding } from "./candidates";
import { buildCollaborativeRunInputHash } from "./collaborative-run-input-hash";
import { rerankCollaborativeCandidates } from "./collaborative-rerank";
import type { CollaborativeRecommendationPrefs } from "./collaborative-types";
import {
  COLLABORATIVE_RECOMMENDATION_ALGORITHM_VERSION,
  EMBEDDING_MODEL,
  STORED_RECOMMENDATION_LIMIT,
} from "./constants";
import { getCollaborativeRecommendationExclusions } from "./exclusions";
import { parseExplanationDetails } from "./explanation-details";
import { isEmbeddingConfigured } from "./embedding-provider";
import { sampleAdventurous } from "./sampler";
import { buildTasteProfile } from "./taste-profile";
import { upsertUserTasteEmbedding } from "./taste-embedding";
import type { ScoredRecommendation } from "./types";

export type GenerateCollaborativeRecommendationsOptions = {
  force?: boolean;
  prefs: CollaborativeRecommendationPrefs;
  samplingSeed?: string;
};

export type GenerateCollaborativeRecommendationsResult = {
  runId: string;
  recommendations: ScoredRecommendation[];
  fromCache: boolean;
};

function normalizeVector(input: number[]): number[] {
  const magnitude = Math.sqrt(input.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return input;
  return input.map((value) => value / magnitude);
}

function averageEmbeddings(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error("Collaborative embeddings must use equal dimensions.");
  }
  const combined = a.map((value, idx) => (value + b[idx]) / 2);
  return normalizeVector(combined);
}

export async function generateCollaborativeRecommendations(
  viewerId: string,
  friendUserId: string,
  options: GenerateCollaborativeRecommendationsOptions,
): Promise<GenerateCollaborativeRecommendationsResult> {
  if (!isEmbeddingConfigured()) {
    throw new Error(
      "Recommendations require OPENAI_API_KEY in the server environment.",
    );
  }

  const friendship = await getFriendshipBetween(viewerId, friendUserId);
  assertAcceptedFriends(friendship, viewerId, friendUserId);

  const samplingSeed = options.samplingSeed ?? randomUUID();

  const [viewerProfile, friendProfile] = await Promise.all([
    buildTasteProfile(viewerId),
    buildTasteProfile(friendUserId),
  ]);

  const runInputHash = buildCollaborativeRunInputHash(
    viewerProfile.inputHash,
    friendProfile.inputHash,
    friendUserId,
    options.prefs,
  );

  const admin = createAdminClient();

  if (!options.force) {
    const { data: latestRun } = await admin
      .from("recommendation_runs")
      .select("id, input_hash")
      .eq("user_id", viewerId)
      .eq("collaborator_user_id", friendUserId)
      .eq("run_kind", "collaborative")
      .eq("collaboration_mode", options.prefs.mode)
      .eq("algorithm_version", COLLABORATIVE_RECOMMENDATION_ALGORITHM_VERSION)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun?.input_hash === runInputHash) {
      const cached = await loadCollaborativeRecommendationsForRun(latestRun.id);
      if (cached.length > 0) {
        return {
          runId: latestRun.id,
          recommendations: cached,
          fromCache: true,
        };
      }
    }
  }

  const [viewerEmbedding, friendEmbedding, exclusions] = await Promise.all([
    upsertUserTasteEmbedding(viewerProfile),
    upsertUserTasteEmbedding(friendProfile),
    getCollaborativeRecommendationExclusions(viewerId, friendUserId),
  ]);
  const queryEmbedding = averageEmbeddings(viewerEmbedding, friendEmbedding);
  const candidates = await getVectorCandidatesForEmbedding(queryEmbedding, exclusions);

  const reranked = rerankCollaborativeCandidates(
    viewerProfile,
    friendProfile,
    candidates,
    options.prefs,
  );
  const sampled = sampleAdventurous(
    reranked,
    options.prefs,
    samplingSeed,
    STORED_RECOMMENDATION_LIMIT,
  );

  const { data: run, error: runError } = await admin
    .from("recommendation_runs")
    .insert({
      user_id: viewerId,
      run_kind: "collaborative",
      collaborator_user_id: friendUserId,
      collaboration_mode: options.prefs.mode,
      friendship_id: friendship?.id ?? null,
      algorithm_version: COLLABORATIVE_RECOMMENDATION_ALGORITHM_VERSION,
      embedding_model: EMBEDDING_MODEL,
      input_hash: runInputHash,
      request_prefs: options.prefs,
      sampling_seed: samplingSeed,
    })
    .select("id")
    .single();

  if (runError || !run) {
    throw new Error(
      runError?.message ?? "Failed to create collaborative recommendation run",
    );
  }

  if (sampled.length > 0) {
    const { error: insertError } = await admin.from("recommendations").insert(
      sampled.map((rec) => ({
        run_id: run.id,
        user_id: viewerId,
        anime_id: rec.anime.id,
        series_id: rec.seriesId,
        similarity_score: rec.similarityScore,
        rerank_score: rec.rerankScore,
        final_score: rec.finalScore,
        reason_codes: rec.reasonCodes,
        explanation: rec.explanation,
        explanation_details: rec.explanationDetails,
        algorithm_version: COLLABORATIVE_RECOMMENDATION_ALGORITHM_VERSION,
      })),
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return {
    runId: run.id,
    recommendations: sampled,
    fromCache: false,
  };
}

async function loadCollaborativeRecommendationsForRun(
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
