import { getFriendshipBetween } from "@/lib/friends/queries";
import { assertAcceptedFriends } from "@/lib/friends/relationship";
import { getUserLibraryEntries } from "@/lib/library/queries";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "@/lib/recommendations/constants";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import { buildTasteProfile } from "@/lib/recommendations/taste-profile";
import { upsertUserTasteEmbedding } from "@/lib/recommendations/taste-embedding";
import { resolvedComparisonsFromRows } from "@/lib/ranking/preference-graph";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { cosineSimilarity, similarityLabel, similarityScorePercent } from "./cosine";
import { confidenceFromStats } from "./taste-similarity-helpers";
import type { TasteSimilarityResult } from "./taste-similarity";

type TasteSimilarityStats = {
  completed: number;
  total: number;
  comparisons: number;
};

async function libraryStats(userId: string) {
  const entries = await getUserLibraryEntries(userId);
  const completed = entries.filter((entry) => entry.status === "completed").length;
  return { completed, total: entries.length };
}

async function ensureEmbedding(
  profile: Awaited<ReturnType<typeof buildTasteProfile>>,
): Promise<number[] | null> {
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
      if (Array.isArray(parsed)) return parseEmbedding(parsed);
    } catch {
      return null;
    }
  }

  return null;
}

export async function loadTasteEmbedding(
  userId: string,
  profileOverride?: Awaited<ReturnType<typeof buildTasteProfile>>,
): Promise<number[] | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("user_taste_profiles")
    .select("embedding, input_hash, embedding_model")
    .eq("user_id", userId)
    .maybeSingle();

  const profile = profileOverride ?? (await buildTasteProfile(userId));
  const parsed = parseEmbedding(row?.embedding);

  if (
    parsed &&
    row?.input_hash === profile.inputHash &&
    row?.embedding_model === EMBEDDING_MODEL &&
    parsed.length === EMBEDDING_DIMENSIONS
  ) {
    return parsed;
  }

  return ensureEmbedding(profile);
}

async function loadResolvedComparisons(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pairwise_series_comparisons")
    .select("left_series_id, right_series_id, winner_series_id")
    .eq("user_id", userId);

  return resolvedComparisonsFromRows(data ?? []);
}

export function scoreTasteSimilarity(
  viewerEmbedding: number[],
  friendEmbedding: number[],
  viewerStats: TasteSimilarityStats,
  friendStats: TasteSimilarityStats,
): Extract<TasteSimilarityResult, { status: "ready" }> {
  const score = similarityScorePercent(
    cosineSimilarity(viewerEmbedding, friendEmbedding),
  );
  return {
    status: "ready",
    score,
    label: similarityLabel(score),
    confidence: confidenceFromStats(viewerStats, friendStats),
  };
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
      loadTasteEmbedding(viewerId),
      loadTasteEmbedding(friendUserId),
      Promise.all([libraryStats(viewerId), loadResolvedComparisons(viewerId)]).then(
        ([stats, comparisons]) => ({
          ...stats,
          comparisons: comparisons.length,
        }),
      ),
      Promise.all([
        libraryStats(friendUserId),
        loadResolvedComparisons(friendUserId),
      ]).then(([stats, comparisons]) => ({
        ...stats,
        comparisons: comparisons.length,
      })),
    ]);

  if (!viewerEmbedding || !friendEmbedding) {
    return { status: "unavailable", reason: "insufficient_data" };
  }

  return scoreTasteSimilarity(
    viewerEmbedding,
    friendEmbedding,
    viewerStats,
    friendStats,
  );
}
