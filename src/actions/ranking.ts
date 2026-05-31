"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { canonicalPairIds } from "@/lib/ranking/canonical-pair";
import { recomputeUserRanking } from "@/lib/ranking/recompute";
import { createClient } from "@/lib/supabase/server";

export type RankingActionState = {
  error?: string;
};

async function upsertComparison(
  userId: string,
  animeIdA: string,
  animeIdB: string,
  values: {
    winner_anime_id: string | null;
    skipped_reason: string | null;
  },
): Promise<RankingActionState> {
  const [leftAnimeId, rightAnimeId] = canonicalPairIds(animeIdA, animeIdB);
  const supabase = await createClient();

  const { error } = await supabase.from("pairwise_comparisons").upsert(
    {
      user_id: userId,
      left_anime_id: leftAnimeId,
      right_anime_id: rightAnimeId,
      winner_anime_id: values.winner_anime_id,
      skipped_reason: values.skipped_reason,
    },
    { onConflict: "user_id,left_anime_id,right_anime_id" },
  );

  if (error) return { error: error.message };
  return {};
}

export async function submitComparison(
  leftAnimeId: string,
  rightAnimeId: string,
  winnerAnimeId: string,
): Promise<RankingActionState> {
  const user = await requireAuthUser();

  if (winnerAnimeId !== leftAnimeId && winnerAnimeId !== rightAnimeId) {
    return { error: "Invalid winner." };
  }

  const supabase = await createClient();
  const animeIds = [leftAnimeId, rightAnimeId];
  const { data: entries } = await supabase
    .from("user_anime_entries")
    .select("anime_id")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .in("anime_id", animeIds);

  if ((entries ?? []).length < 2) {
    return { error: "Both anime must be completed in your library." };
  }

  const saveResult = await upsertComparison(user.id, leftAnimeId, rightAnimeId, {
    winner_anime_id: winnerAnimeId,
    skipped_reason: null,
  });
  if (saveResult.error) return saveResult;

  await logUserEvent(user.id, USER_EVENT_TYPES.comparisonCreated, {
    metadata: { leftAnimeId, rightAnimeId, winnerAnimeId },
  });

  try {
    await recomputeUserRanking(user.id);
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Comparison saved but ranking failed to update. Add SUPABASE_SECRET_KEY.",
    };
  }

  revalidatePath("/ranking");
  revalidatePath("/");
  return {};
}

export async function skipComparison(
  leftAnimeId: string,
  rightAnimeId: string,
  reason: string,
): Promise<RankingActionState> {
  const user = await requireAuthUser();

  const saveResult = await upsertComparison(user.id, leftAnimeId, rightAnimeId, {
    winner_anime_id: null,
    skipped_reason: reason,
  });
  if (saveResult.error) return saveResult;

  revalidatePath("/ranking");
  return {};
}
