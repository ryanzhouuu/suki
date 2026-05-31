import { createAdminClient } from "@/lib/supabase/admin";

import {
  EMBEDDING_MODEL,
  RECOMMENDATION_ALGORITHM_VERSION,
} from "./constants";
import {
  createEmbeddingProvider,
  isEmbeddingConfigured,
} from "./embedding-provider";
import type { TasteProfile } from "./types";

export async function upsertUserTasteEmbedding(
  profile: TasteProfile,
): Promise<number[]> {
  if (!isEmbeddingConfigured()) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("user_taste_profiles")
    .select("input_hash, embedding")
    .eq("user_id", profile.userId)
    .maybeSingle();

  if (existing?.input_hash === profile.inputHash && existing.embedding) {
    return existing.embedding as unknown as number[];
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
