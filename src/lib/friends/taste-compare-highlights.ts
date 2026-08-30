import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { assertAcceptedFriends } from "@/lib/friends/relationship";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import {
  buildCompareHighlightsFromRankings,
  emptyTasteCompareHighlights,
  type TasteCompareHighlights,
} from "./taste-similarity-helpers";

export async function completedSeriesIdsFromAnimeIds(
  animeIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  if (animeIds.length === 0) return new Set();

  const { data: maps } = await supabase
    .from("anime_series_map")
    .select("series_id")
    .in("anime_id", animeIds);

  return new Set((maps ?? []).map((mapping) => mapping.series_id));
}

async function completedSeriesIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data: completed } = await supabase
    .from("user_anime_entries")
    .select("anime_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  return completedSeriesIdsFromAnimeIds(
    (completed ?? []).map((row) => row.anime_id),
    supabase,
  );
}

export async function getTasteCompareHighlights(
  viewerId: string,
  friendUserId: string,
  limit = 5,
): Promise<TasteCompareHighlights> {
  const friendship = await getFriendshipBetween(viewerId, friendUserId);

  try {
    assertAcceptedFriends(friendship, viewerId, friendUserId);
  } catch {
    return emptyTasteCompareHighlights();
  }

  const supabase = await createClient();
  const [viewerRankings, friendRankings] = await Promise.all([
    supabase
      .from("derived_series_rankings")
      .select("rank, series_id, series(*)")
      .eq("user_id", viewerId)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
      .order("rank", { ascending: true })
      .limit(25),
    supabase
      .from("derived_series_rankings")
      .select("rank, series_id, series(*)")
      .eq("user_id", friendUserId)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
      .order("rank", { ascending: true })
      .limit(25),
  ]);

  const [viewerCompleted, friendCompleted] = await Promise.all([
    completedSeriesIds(viewerId),
    completedSeriesIds(friendUserId),
  ]);
  const intersection = [...viewerCompleted].filter((id) =>
    friendCompleted.has(id),
  );

  return buildCompareHighlightsFromRankings(
    (viewerRankings.data ?? []).map((row) => ({
      rank: row.rank,
      series_id: row.series_id,
      series: row.series as Tables<"series"> | null,
    })),
    (friendRankings.data ?? []).map((row) => ({
      rank: row.rank,
      series_id: row.series_id,
      series: row.series as Tables<"series"> | null,
    })),
    intersection.length,
    limit,
  );
}
