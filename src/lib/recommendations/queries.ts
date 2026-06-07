import { createClient } from "@/lib/supabase/server";

import {
  COLLABORATIVE_RECOMMENDATION_ALGORITHM_VERSION,
  RECOMMENDATION_ALGORITHM_VERSION,
} from "./constants";
import { getDismissedAnimeIds } from "./dismissed";
import { parseExplanationDetails } from "./explanation-details";
import type { CollaborativeRecommendationMode } from "./collaborative-types";
import type { RecommendationRow } from "./types";

type GetUserRecommendationsOptions = {
  limit?: number;
  includeLibraryStatus?: boolean;
};

export async function getUserRecommendations(
  userId: string,
  options?: GetUserRecommendationsOptions,
): Promise<RecommendationRow[]> {
  const supabase = await createClient();

  const { data: latestRun } = await supabase
    .from("recommendation_runs")
    .select("id")
    .eq("user_id", userId)
    .eq("run_kind", "personal")
    .eq("algorithm_version", RECOMMENDATION_ALGORITHM_VERSION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRun) return [];

  const { data, error } = await supabase
    .from("recommendations")
    .select("*, anime(*)")
    .eq("run_id", latestRun.id)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const dismissed = new Set(await getDismissedAnimeIds(userId));
  const filtered = (data ?? []).filter((row) => !dismissed.has(row.anime_id));

  const limited =
    options?.limit != null ? filtered.slice(0, options.limit) : filtered;

  let libraryByAnimeId = new Map<
    string,
    NonNullable<RecommendationRow["libraryEntry"]>
  >();

  if (options?.includeLibraryStatus && limited.length > 0) {
    const animeIds = limited.map((row) => row.anime_id);
    const { data: libraryRows } = await supabase
      .from("user_anime_entries")
      .select("id, anime_id, status, progress_episodes")
      .eq("user_id", userId)
      .in("anime_id", animeIds);

    libraryByAnimeId = new Map(
      (libraryRows ?? []).map((entry) => [
        entry.anime_id,
        {
          id: entry.id,
          status: entry.status,
          progress_episodes: entry.progress_episodes,
        },
      ]),
    );
  }

  return limited.map((row) => ({
    ...(row as RecommendationRow),
    parsedExplanationDetails: parseExplanationDetails(
      row.explanation_details,
      row.explanation,
    ),
    libraryEntry: libraryByAnimeId.get(row.anime_id) ?? null,
  }));
}

export async function getEmbeddingCatalogCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("anime_embeddings")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}

export async function getCollaborativeRecommendations(
  viewerId: string,
  friendUserId: string,
  mode: CollaborativeRecommendationMode,
): Promise<RecommendationRow[]> {
  const supabase = await createClient();

  const { data: latestRun } = await supabase
    .from("recommendation_runs")
    .select("id")
    .eq("user_id", viewerId)
    .eq("run_kind", "collaborative")
    .eq("collaborator_user_id", friendUserId)
    .eq("collaboration_mode", mode)
    .eq("algorithm_version", COLLABORATIVE_RECOMMENDATION_ALGORITHM_VERSION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRun) return [];

  const { data, error } = await supabase
    .from("recommendations")
    .select("*, anime(*)")
    .eq("run_id", latestRun.id)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  const dismissed = new Set(await getDismissedAnimeIds(viewerId));
  return (data ?? [])
    .filter((row) => !dismissed.has(row.anime_id))
    .map((row) => ({
      ...(row as RecommendationRow),
      parsedExplanationDetails: parseExplanationDetails(
        row.explanation_details,
        row.explanation,
      ),
      libraryEntry: null,
    }));
}
