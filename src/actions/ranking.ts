"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { recomputeUserRanking } from "@/lib/ranking/recompute";
import { createClient } from "@/lib/supabase/server";

export type RankingActionState = {
  error?: string;
};

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

  const { error } = await supabase.from("pairwise_comparisons").insert({
    user_id: user.id,
    left_anime_id: leftAnimeId,
    right_anime_id: rightAnimeId,
    winner_anime_id: winnerAnimeId,
  });

  if (error) return { error: error.message };

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
  const supabase = await createClient();

  const { error } = await supabase.from("pairwise_comparisons").insert({
    user_id: user.id,
    left_anime_id: leftAnimeId,
    right_anime_id: rightAnimeId,
    winner_anime_id: null,
    skipped_reason: reason,
  });

  if (error) return { error: error.message };

  revalidatePath("/ranking");
  return {};
}
