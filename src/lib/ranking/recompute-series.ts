import { ELO_INITIAL_SCORE, RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  applyComparison,
  confidenceFromComparisonCount,
  type EloEntityState,
} from "./elo";

async function getCompletedSeriesIds(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { data: completed } = await admin
    .from("user_anime_entries")
    .select("anime_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  const animeIds = (completed ?? []).map((row) => row.anime_id);
  if (animeIds.length === 0) return [];

  const { data: maps } = await admin
    .from("anime_series_map")
    .select("series_id")
    .in("anime_id", animeIds);

  return [...new Set((maps ?? []).map((m) => m.series_id))];
}

export async function recomputeUserSeriesRanking(userId: string) {
  const admin = createAdminClient();
  const seriesIds = await getCompletedSeriesIds(admin, userId);

  if (seriesIds.length === 0) {
    await admin
      .from("derived_series_rankings")
      .delete()
      .eq("user_id", userId)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION);
    return;
  }

  const scores = new Map<string, EloEntityState>();
  for (const seriesId of seriesIds) {
    scores.set(seriesId, {
      entityId: seriesId,
      score: ELO_INITIAL_SCORE,
      comparisonCount: 0,
    });
  }

  const { data: comparisons } = await admin
    .from("pairwise_series_comparisons")
    .select("left_series_id, right_series_id, winner_series_id")
    .eq("user_id", userId)
    .not("winner_series_id", "is", null)
    .order("created_at", { ascending: true });

  for (const comparison of comparisons ?? []) {
    const winnerId = comparison.winner_series_id;
    if (!winnerId) continue;

    const loserId =
      winnerId === comparison.left_series_id
        ? comparison.right_series_id
        : comparison.left_series_id;

    if (!scores.has(winnerId) || !scores.has(loserId)) continue;

    applyComparison(scores, winnerId, loserId);
  }

  const ranked = [...scores.values()].sort((a, b) => b.score - a.score);

  await admin
    .from("derived_series_rankings")
    .delete()
    .eq("user_id", userId)
    .eq("algorithm_version", RANKING_ALGORITHM_VERSION);

  if (ranked.length > 0) {
    const { error } = await admin.from("derived_series_rankings").insert(
      ranked.map((entry, index) => ({
        user_id: userId,
        series_id: entry.entityId,
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

/** Series-level ranking recompute (primary). */
export async function recomputeUserRanking(userId: string) {
  return recomputeUserSeriesRanking(userId);
}
