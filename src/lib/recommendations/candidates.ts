import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { VECTOR_CANDIDATE_LIMIT } from "./constants";
import type { CandidateAnime, TasteProfile } from "./types";
import type { RecommendationExclusions } from "./exclusions";

type MatchRow = {
  anime_id: string;
  similarity: number;
};

export async function getVectorCandidates(
  profile: TasteProfile,
  exclusions: RecommendationExclusions,
): Promise<CandidateAnime[]> {
  const supabase = await createClient();

  const { data: tasteRow } = await supabase
    .from("user_taste_profiles")
    .select("embedding")
    .eq("user_id", profile.userId)
    .maybeSingle();

  if (!tasteRow?.embedding) {
    throw new Error("User taste profile embedding is missing.");
  }

  const { data: matches, error } = await supabase.rpc("match_anime_embeddings", {
    query_embedding: tasteRow.embedding,
    match_count: VECTOR_CANDIDATE_LIMIT,
    excluded_anime_ids: exclusions.excludedAnimeIds,
    excluded_series_ids: exclusions.excludedSeriesIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (matches ?? []) as MatchRow[];
  if (rows.length === 0) return [];

  const animeIds = rows.map((r) => r.anime_id);
  const admin = createAdminClient();

  const { data: animeRows, error: animeError } = await admin
    .from("anime")
    .select("*")
    .in("id", animeIds);

  if (animeError) {
    throw new Error(animeError.message);
  }

  const { data: maps } = await admin
    .from("anime_series_map")
    .select("anime_id, series_id")
    .in("anime_id", animeIds);

  const seriesByAnime = new Map(
    (maps ?? []).map((m) => [m.anime_id, m.series_id]),
  );
  const similarityByAnime = new Map(
    rows.map((r) => [r.anime_id, r.similarity]),
  );

  const candidates: CandidateAnime[] = (animeRows ?? []).map((anime) => ({
    ...(anime as Tables<"anime">),
    seriesId: seriesByAnime.get(anime.id) ?? null,
    similarityScore: similarityByAnime.get(anime.id) ?? 0,
  }));

  return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
}
