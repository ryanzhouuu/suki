import { createClient } from "@/lib/supabase/server";

import { RECOMMENDATION_ALGORITHM_VERSION } from "./constants";
import type { RecommendationRow } from "./types";

export async function getUserRecommendations(
  userId: string,
): Promise<RecommendationRow[]> {
  const supabase = await createClient();

  const { data: latestRun } = await supabase
    .from("recommendation_runs")
    .select("id")
    .eq("user_id", userId)
    .eq("algorithm_version", RECOMMENDATION_ALGORITHM_VERSION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRun) return [];

  const { data, error } = await supabase
    .from("recommendations")
    .select("*, anime(*)")
    .eq("run_id", latestRun.id)
    .order("final_score", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RecommendationRow[];
}

export async function getEmbeddingCatalogCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("anime_embeddings")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}
