import { ELO_INITIAL_SCORE, RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  applyComparison,
  confidenceFromComparisonCount,
  type EloAnimeState,
} from "./elo";

export async function recomputeUserRanking(userId: string) {
  const admin = createAdminClient();

  const { data: completedEntries } = await admin
    .from("user_anime_entries")
    .select("anime_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  const animeIds = (completedEntries ?? []).map((e) => e.anime_id);
  if (animeIds.length === 0) {
    await admin
      .from("derived_rankings")
      .delete()
      .eq("user_id", userId)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION);
    return;
  }

  const scores = new Map<string, EloAnimeState>();
  for (const animeId of animeIds) {
    scores.set(animeId, {
      animeId,
      score: ELO_INITIAL_SCORE,
      comparisonCount: 0,
    });
  }

  const { data: comparisons } = await admin
    .from("pairwise_comparisons")
    .select("left_anime_id, right_anime_id, winner_anime_id")
    .eq("user_id", userId)
    .not("winner_anime_id", "is", null)
    .order("created_at", { ascending: true });

  for (const comparison of comparisons ?? []) {
    const winnerId = comparison.winner_anime_id;
    if (!winnerId) continue;

    const loserId =
      winnerId === comparison.left_anime_id
        ? comparison.right_anime_id
        : comparison.left_anime_id;

    if (!scores.has(winnerId) || !scores.has(loserId)) continue;

    applyComparison(scores, winnerId, loserId);
  }

  const ranked = [...scores.values()].sort((a, b) => b.score - a.score);

  await admin
    .from("derived_rankings")
    .delete()
    .eq("user_id", userId)
    .eq("algorithm_version", RANKING_ALGORITHM_VERSION);

  if (ranked.length > 0) {
    const { error } = await admin.from("derived_rankings").insert(
      ranked.map((entry, index) => ({
        user_id: userId,
        anime_id: entry.animeId,
        rank: index + 1,
        score: entry.score,
        confidence: confidenceFromComparisonCount(entry.comparisonCount),
        comparison_count: entry.comparisonCount,
        algorithm_version: RANKING_ALGORITHM_VERSION,
        computed_at: new Date().toISOString(),
      })),
    );
    if (error) throw new Error(error.message);
  }
}
