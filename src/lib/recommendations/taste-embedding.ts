import { createAdminClient } from "@/lib/supabase/admin";

import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  RECOMMENDATION_ALGORITHM_VERSION,
} from "./constants";
import {
  createEmbeddingProvider,
  isEmbeddingConfigured,
} from "./embedding-provider";
import type { TasteProfile } from "./types";

function parseEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const parsed = value
      .map((item) => (typeof item === "number" ? item : Number(item)))
      .filter((item) => Number.isFinite(item));
    return parsed.length > 0 ? parsed : null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseEmbedding(parsed);
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function upsertUserTasteEmbedding(
  profile: TasteProfile,
): Promise<number[]> {
  if (!isEmbeddingConfigured()) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("user_taste_profiles")
    .select("input_hash, embedding, embedding_model")
    .eq("user_id", profile.userId)
    .maybeSingle();

  const existingEmbedding = parseEmbedding(existing?.embedding);
  if (
    existing?.input_hash === profile.inputHash &&
    existing?.embedding_model === EMBEDDING_MODEL &&
    existingEmbedding?.length === EMBEDDING_DIMENSIONS
  ) {
    return existingEmbedding;
  }

  const provider = createEmbeddingProvider();
  const [embedding] = await provider.embed([profile.profileText]);

  const { error } = await admin.from("user_taste_profiles").upsert(
    {
      user_id: profile.userId,
      embedding_model: EMBEDDING_MODEL,
      embedding,
      profile_text: profile.profileText,
      input_hash: profile.inputHash,
      algorithm_version: RECOMMENDATION_ALGORITHM_VERSION,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return embedding;
}
