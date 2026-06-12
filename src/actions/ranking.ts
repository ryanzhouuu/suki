"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { canonicalPairIds } from "@/lib/ranking/canonical-pair";
import {
  getNextComparisonPair,
  type SeriesComparisonPair,
} from "@/lib/ranking/prompt";
import { recomputeUserRanking } from "@/lib/ranking/recompute-series";
import { normalizeGenreParams } from "@/lib/anilist/genres";
import { userHasCompletedSeries } from "@/lib/series/queries";
import { createClient } from "@/lib/supabase/server";

export type RankingActionState = {
  error?: string;
};

export async function fetchComparisonPair(
  genres: string[],
): Promise<{ pair: SeriesComparisonPair | null; error?: string }> {
  try {
    const user = await requireAuthUser();
    const genreFilter = normalizeGenreParams(genres);
    const pair = await getNextComparisonPair(user.id, { genreFilter });
    return { pair };
  } catch (e) {
    return {
      pair: null,
      error: e instanceof Error ? e.message : "Could not load comparison.",
    };
  }
}

async function upsertSeriesComparison(
  userId: string,
  seriesIdA: string,
  seriesIdB: string,
  values: {
    winner_series_id: string | null;
    skipped_reason: string | null;
  },
): Promise<RankingActionState> {
  const [leftSeriesId, rightSeriesId] = canonicalPairIds(seriesIdA, seriesIdB);
  const supabase = await createClient();

  const { error } = await supabase.from("pairwise_series_comparisons").upsert(
    {
      user_id: userId,
      left_series_id: leftSeriesId,
      right_series_id: rightSeriesId,
      winner_series_id: values.winner_series_id,
      skipped_reason: values.skipped_reason,
    },
    { onConflict: "user_id,left_series_id,right_series_id" },
  );

  if (error) return { error: error.message };
  return {};
}

export async function submitComparison(
  leftSeriesId: string,
  rightSeriesId: string,
  winnerSeriesId: string,
): Promise<RankingActionState> {
  const user = await requireAuthUser();

  if (winnerSeriesId !== leftSeriesId && winnerSeriesId !== rightSeriesId) {
    return { error: "Invalid winner." };
  }

  const eligible = await userHasCompletedSeries(user.id, [
    leftSeriesId,
    rightSeriesId,
  ]);

  if (!eligible) {
    return {
      error:
        "Both series must include at least one completed anime in your library.",
    };
  }

  const saveResult = await upsertSeriesComparison(
    user.id,
    leftSeriesId,
    rightSeriesId,
    {
      winner_series_id: winnerSeriesId,
      skipped_reason: null,
    },
  );
  if (saveResult.error) return saveResult;

  await logUserEvent(user.id, USER_EVENT_TYPES.seriesComparisonCreated, {
    metadata: { leftSeriesId, rightSeriesId, winnerSeriesId },
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
  revalidatePath("/home");
  return {};
}

export async function resetSeriesRanking(
  seriesId: string,
): Promise<RankingActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  // Hard-delete every comparison involving this series for this user.
  // This also removes any skipped pairs, so they re-surface in the prompt loop.
  const { error } = await supabase
    .from("pairwise_series_comparisons")
    .delete()
    .eq("user_id", user.id)
    .or(`left_series_id.eq.${seriesId},right_series_id.eq.${seriesId}`);
  if (error) return { error: error.message };

  await logUserEvent(user.id, USER_EVENT_TYPES.seriesRankingReset, {
    metadata: { seriesId },
  });

  try {
    await recomputeUserRanking(user.id);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Ranking failed to recompute.",
    };
  }

  revalidatePath("/ranking");
  revalidatePath("/home");
  return {};
}

export async function skipComparison(
  leftSeriesId: string,
  rightSeriesId: string,
  reason: string,
): Promise<RankingActionState> {
  const user = await requireAuthUser();

  const saveResult = await upsertSeriesComparison(
    user.id,
    leftSeriesId,
    rightSeriesId,
    {
      winner_series_id: null,
      skipped_reason: reason,
    },
  );
  if (saveResult.error) return saveResult;

  revalidatePath("/ranking");
  return {};
}
