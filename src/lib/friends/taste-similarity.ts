import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { assertAcceptedFriends } from "@/lib/friends/relationship";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { getUserLibraryEntries } from "@/lib/library/queries";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "@/lib/recommendations/constants";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import { buildTasteProfile } from "@/lib/recommendations/taste-profile";
import { upsertUserTasteEmbedding } from "@/lib/recommendations/taste-embedding";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import {
  buildLovedUnwatched,
  buildSharedGenreStrength,
  buildSharedPlanToWatch,
  buildTasteDifferences,
  buildCompareHighlightsFromRankings,
  confidenceFromStats,
  emptyTasteCompareHighlights,
  type LovedDiscoveryItem,
  type SharedGenreStrength,
  type SharedWatchlistItem,
  type TasteDifference,
  type TasteMatchLibraryRow,
  type TasteCompareHighlights,
} from "./taste-similarity-helpers";
import {
  cosineSimilarity,
  similarityLabel,
  similarityScorePercent,
} from "./cosine";

export type TasteSimilarityResult =
  | {
      status: "ready";
      score: number;
      label: string;
      confidence: "low" | "medium" | "high";
    }
  | {
      status: "unavailable";
      reason: "not_configured" | "insufficient_data" | "not_friends";
    };

export type {
  LovedDiscoveryItem,
  SharedGenreStrength,
  SharedWatchlistItem,
  TasteDifference,
  SeriesHighlight,
  TasteCompareHighlights,
} from "./taste-similarity-helpers";

export type TasteFormatDifference = {
  format: string;
  viewerCount: number;
  friendCount: number;
  delta: number;
};

export type TasteMatchProfile = {
  similarity: TasteSimilarityResult;
  highlights: TasteCompareHighlights;
  sharedGenres: SharedGenreStrength[];
  genreDifferences: TasteDifference[];
  formatDifferences: TasteFormatDifference[];
  viewerLovedFriendUnwatched: LovedDiscoveryItem[];
  friendLovedViewerUnwatched: LovedDiscoveryItem[];
  sharedPlanToWatch: SharedWatchlistItem[];
};

async function libraryStats(userId: string) {
  const entries = await getUserLibraryEntries(userId);
  const completed = entries.filter((e) => e.status === "completed").length;
  return { completed, total: entries.length };
}

async function comparisonCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("pairwise_series_comparisons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("winner_series_id", "is", null);

  return count ?? 0;
}

async function ensureEmbedding(userId: string): Promise<number[] | null> {
  const profile = await buildTasteProfile(userId);

  if (
    !profile.profileText.trim() ||
    (profile.signals.completedTitles.length === 0 &&
      profile.signals.topRankedSeries.length === 0)
  ) {
    return null;
  }

  try {
    return await upsertUserTasteEmbedding(profile);
  } catch {
    return null;
  }
}

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

async function loadEmbedding(userId: string): Promise<number[] | null> {
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("user_taste_profiles")
    .select("embedding, input_hash, embedding_model")
    .eq("user_id", userId)
    .maybeSingle();

  const profile = await buildTasteProfile(userId);
  const parsed = parseEmbedding(row?.embedding);

  if (
    parsed &&
    row?.input_hash === profile.inputHash &&
    row?.embedding_model === EMBEDDING_MODEL &&
    parsed.length === EMBEDDING_DIMENSIONS
  ) {
    return parsed;
  }

  return ensureEmbedding(userId);
}

export async function getTasteSimilarity(
  viewerId: string,
  friendUserId: string,
): Promise<TasteSimilarityResult> {
  const friendship = await getFriendshipBetween(viewerId, friendUserId);

  try {
    assertAcceptedFriends(friendship, viewerId, friendUserId);
  } catch {
    return { status: "unavailable", reason: "not_friends" };
  }

  if (!isEmbeddingConfigured()) {
    return { status: "unavailable", reason: "not_configured" };
  }

  const [viewerEmbedding, friendEmbedding, viewerStats, friendStats] =
    await Promise.all([
      loadEmbedding(viewerId),
      loadEmbedding(friendUserId),
      libraryStats(viewerId).then(async (s) => ({
        ...s,
        comparisons: await comparisonCount(viewerId),
      })),
      libraryStats(friendUserId).then(async (s) => ({
        ...s,
        comparisons: await comparisonCount(friendUserId),
      })),
    ]);

  if (!viewerEmbedding || !friendEmbedding) {
    return { status: "unavailable", reason: "insufficient_data" };
  }

  const cosine = cosineSimilarity(viewerEmbedding, friendEmbedding);
  const score = similarityScorePercent(cosine);
  const confidence = confidenceFromStats(viewerStats, friendStats);

  return {
    status: "ready",
    score,
    label: similarityLabel(score),
    confidence,
  };
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

  const viewerRows = viewerRankings.data ?? [];
  const friendRows = friendRankings.data ?? [];

  const [viewerCompleted, friendCompleted] = await Promise.all([
    completedSeriesIds(viewerId),
    completedSeriesIds(friendUserId),
  ]);

  const intersection = [...viewerCompleted].filter((id) =>
    friendCompleted.has(id),
  );

  return buildCompareHighlightsFromRankings(
    viewerRows.map((r) => ({
      rank: r.rank,
      series_id: r.series_id,
      series: r.series as Tables<"series"> | null,
    })),
    friendRows.map((r) => ({
      rank: r.rank,
      series_id: r.series_id,
      series: r.series as Tables<"series"> | null,
    })),
    intersection.length,
    limit,
  );
}

async function completedSeriesIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data: completed } = await supabase
    .from("user_anime_entries")
    .select("anime_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  const animeIds = (completed ?? []).map((r) => r.anime_id);
  if (animeIds.length === 0) return new Set();

  const { data: maps } = await supabase
    .from("anime_series_map")
    .select("series_id")
    .in("anime_id", animeIds);

  return new Set((maps ?? []).map((m) => m.series_id));
}

function asTasteRows(entries: Awaited<ReturnType<typeof getUserLibraryEntries>>): TasteMatchLibraryRow[] {
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

  const [similarity, highlights, viewerEntries, friendEntries] = await Promise.all([
    getTasteSimilarity(viewerId, friendUserId),
    getTasteCompareHighlights(viewerId, friendUserId),
    getUserLibraryEntries(viewerId),
    getUserLibraryEntries(friendUserId),
  ]);

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
