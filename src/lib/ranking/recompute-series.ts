import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

import { betaToScore, fitBradleyTerry } from "./bradley-terry";
import { confidenceFromComparisonCount } from "./elo";
import { resolvedComparisonsFromRows } from "./preference-graph";

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

  // Even with no completed series we call the RPC with an empty row set so it
  // clears any stale ranking rows for this user/version.
  let rows: {
    series_id: string;
    rank: number;
    score: number;
    confidence: ReturnType<typeof confidenceFromComparisonCount>;
    comparison_count: number;
    uncertainty: number;
  }[] = [];

  if (seriesIds.length > 0) {
    const { data: comparisons } = await admin
      .from("pairwise_series_comparisons")
      .select("left_series_id, right_series_id, winner_series_id")
      .eq("user_id", userId)
      .not("winner_series_id", "is", null);

    const edges = resolvedComparisonsFromRows(comparisons ?? []);
    const fit = fitBradleyTerry(seriesIds, edges);

    rows = [...fit.entries()]
      .sort((a, b) => b[1].beta - a[1].beta)
      .map(([seriesId, state], index) => ({
        series_id: seriesId,
        rank: index + 1,
        score: betaToScore(state.beta),
        confidence: confidenceFromComparisonCount(state.comparisonCount),
        comparison_count: state.comparisonCount,
        uncertainty: state.uncertainty,
      }));
  }

  const { error } = await admin.rpc("replace_user_series_rankings", {
    p_user_id: userId,
    p_algorithm_version: RANKING_ALGORITHM_VERSION,
    p_rows: rows,
  });
  if (error) throw new Error(error.message);
}

/** Series-level ranking recompute (primary). */
export async function recomputeUserRanking(userId: string) {
  return recomputeUserSeriesRanking(userId);
}
