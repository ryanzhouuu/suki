import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { assertAcceptedFriends } from "@/lib/friends/relationship";
import { getUserLibraryEntries } from "@/lib/library/queries";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import { buildTasteProfile } from "@/lib/recommendations/taste-profile";
import { resolvedComparisonsFromRows } from "@/lib/ranking/preference-graph";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { completedSeriesIdsFromAnimeIds } from "./taste-compare-highlights";
import {
  buildCompareHighlightsFromRankings,
  buildLovedUnwatched,
  buildSharedGenreStrength,
  buildSharedPlanToWatch,
  buildTasteDifferences,
  emptyTasteCompareHighlights,
  type TasteMatchLibraryRow,
} from "./taste-similarity-helpers";
import {
  loadTasteEmbedding,
  scoreTasteSimilarity,
} from "./taste-similarity-score";
import type {
  TasteFormatDifference,
  TasteMatchProfile,
  TasteSimilarityResult,
} from "./taste-similarity";

function asTasteRows(
  entries: Awaited<ReturnType<typeof getUserLibraryEntries>>,
): TasteMatchLibraryRow[] {
  return entries.map((entry) => ({
    anime_id: entry.anime_id,
    status: entry.status,
    personal_score: entry.personal_score,
    priority: entry.priority,
    anime: {
      id: entry.anime.id,
      english_title: entry.anime.english_title,
      romaji_title: entry.anime.romaji_title,
      cover_image_url: entry.anime.cover_image_url,
      genres: entry.anime.genres,
      format: entry.anime.format,
    },
  }));
}

function buildFormatDifferences(
  viewerRows: TasteMatchLibraryRow[],
  friendRows: TasteMatchLibraryRow[],
  limit = 4,
): TasteFormatDifference[] {
  const countFormats = (rows: TasteMatchLibraryRow[]) => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!["watching", "completed", "paused"].includes(row.status)) continue;
      const format = row.anime.format?.trim();
      if (!format) continue;
      counts.set(format, (counts.get(format) ?? 0) + 1);
    }
    return counts;
  };

  const viewerCounts = countFormats(viewerRows);
  const friendCounts = countFormats(friendRows);
  const formats = new Set([...viewerCounts.keys(), ...friendCounts.keys()]);

  return [...formats]
    .map((format) => {
      const viewerCount = viewerCounts.get(format) ?? 0;
      const friendCount = friendCounts.get(format) ?? 0;
      return { format, viewerCount, friendCount, delta: viewerCount - friendCount };
    })
    .filter((row) => row.delta !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.delta) - Math.abs(a.delta) || a.format.localeCompare(b.format),
    )
    .slice(0, limit);
}

export async function getTasteMatchProfile(
  viewerId: string,
  friendUserId: string,
): Promise<TasteMatchProfile> {
  const friendship = await getFriendshipBetween(viewerId, friendUserId);

  try {
    assertAcceptedFriends(friendship, viewerId, friendUserId);
  } catch {
    return {
      similarity: { status: "unavailable", reason: "not_friends" },
      highlights: emptyTasteCompareHighlights(),
      sharedGenres: [],
      genreDifferences: [],
      formatDifferences: [],
      viewerLovedFriendUnwatched: [],
      friendLovedViewerUnwatched: [],
      sharedPlanToWatch: [],
    };
  }

  const supabase = await createClient();
  const [
    viewerEntries,
    friendEntries,
    viewerRankingsResult,
    friendRankingsResult,
    viewerComparisonsResult,
    friendComparisonsResult,
  ] = await Promise.all([
    getUserLibraryEntries(viewerId),
    getUserLibraryEntries(friendUserId),
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
    supabase
      .from("pairwise_series_comparisons")
      .select("left_series_id, right_series_id, winner_series_id")
      .eq("user_id", viewerId),
    supabase
      .from("pairwise_series_comparisons")
      .select("left_series_id, right_series_id, winner_series_id")
      .eq("user_id", friendUserId),
  ]);

  const viewerRankings = (viewerRankingsResult.data ?? []).map((row) => ({
    rank: row.rank,
    series_id: row.series_id,
    series: row.series as Tables<"series"> | null,
  }));
  const friendRankings = (friendRankingsResult.data ?? []).map((row) => ({
    rank: row.rank,
    series_id: row.series_id,
    series: row.series as Tables<"series"> | null,
  }));
  const viewerComparisonRows = viewerComparisonsResult.data ?? [];
  const friendComparisonRows = friendComparisonsResult.data ?? [];
  const viewerResolvedComparisons = resolvedComparisonsFromRows(
    viewerComparisonRows,
  );
  const friendResolvedComparisons = resolvedComparisonsFromRows(
    friendComparisonRows,
  );

  const [viewerProfile, friendProfile] = await Promise.all([
    buildTasteProfile(viewerId, {
      entries: viewerEntries,
      rankings: viewerRankings.slice(0, 15),
      comparisons: viewerComparisonRows,
    }),
    buildTasteProfile(friendUserId, {
      entries: friendEntries,
      rankings: friendRankings.slice(0, 15),
      comparisons: friendComparisonRows,
    }),
  ]);
  const [viewerEmbedding, friendEmbedding, viewerCompleted, friendCompleted] =
    await Promise.all([
      isEmbeddingConfigured()
        ? loadTasteEmbedding(viewerId, viewerProfile)
        : null,
      isEmbeddingConfigured()
        ? loadTasteEmbedding(friendUserId, friendProfile)
        : null,
      completedSeriesIdsFromAnimeIds(
        viewerEntries
          .filter((entry) => entry.status === "completed")
          .map((entry) => entry.anime_id),
        supabase,
      ),
      completedSeriesIdsFromAnimeIds(
        friendEntries
          .filter((entry) => entry.status === "completed")
          .map((entry) => entry.anime_id),
        supabase,
      ),
    ]);

  const similarity: TasteSimilarityResult = !isEmbeddingConfigured()
    ? { status: "unavailable", reason: "not_configured" }
    : !viewerEmbedding || !friendEmbedding
      ? { status: "unavailable", reason: "insufficient_data" }
      : scoreTasteSimilarity(
          viewerEmbedding,
          friendEmbedding,
          {
            completed: viewerEntries.filter(
              (entry) => entry.status === "completed",
            ).length,
            total: viewerEntries.length,
            comparisons: viewerResolvedComparisons.length,
          },
          {
            completed: friendEntries.filter(
              (entry) => entry.status === "completed",
            ).length,
            total: friendEntries.length,
            comparisons: friendResolvedComparisons.length,
          },
        );

  const intersection = [...viewerCompleted].filter((id) =>
    friendCompleted.has(id),
  );
  const highlights = buildCompareHighlightsFromRankings(
    viewerRankings,
    friendRankings,
    intersection.length,
    5,
  );
  const viewerRows = asTasteRows(viewerEntries);
  const friendRows = asTasteRows(friendEntries);

  return {
    similarity,
    highlights,
    sharedGenres: buildSharedGenreStrength(viewerRows, friendRows),
    genreDifferences: buildTasteDifferences(viewerRows, friendRows),
    formatDifferences: buildFormatDifferences(viewerRows, friendRows),
    viewerLovedFriendUnwatched: buildLovedUnwatched(viewerRows, friendRows),
    friendLovedViewerUnwatched: buildLovedUnwatched(friendRows, viewerRows),
    sharedPlanToWatch: buildSharedPlanToWatch(viewerRows, friendRows),
  };
}
