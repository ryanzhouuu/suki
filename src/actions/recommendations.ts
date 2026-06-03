"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { generateRecommendations } from "@/lib/recommendations/generate";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import { getUserRecommendations } from "@/lib/recommendations/queries";
import { parseRecommendationRequestPrefs } from "@/lib/recommendations/request-prefs";

export type RecommendationsActionState = {
  error?: string;
  message?: string;
};

export async function refreshRecommendations(
  _prev: RecommendationsActionState,
  formData: FormData,
): Promise<RecommendationsActionState> {
  const user = await requireAuthUser();

  if (!isEmbeddingConfigured()) {
    return {
      error:
        "Recommendations are not configured. Add OPENAI_API_KEY to the server environment.",
    };
  }

  const parsed = parseRecommendationRequestPrefs(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    await generateRecommendations(user.id, {
      force: true,
      prefs: parsed.prefs,
    });
    await logUserEvent(user.id, USER_EVENT_TYPES.recommendationRefreshed, {
      metadata: { requestPrefs: parsed.prefs },
    });
    revalidatePath("/recommendations");
    revalidatePath("/home");
    return { message: "Recommendations updated." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to refresh recommendations.",
    };
  }
}

export async function logRecommendationViewed(animeId?: string) {
  const user = await requireAuthUser();
  await logUserEvent(user.id, USER_EVENT_TYPES.recommendationViewed, {
    animeId,
    metadata: {},
  });
}

export async function logRecommendationClicked(animeId: string) {
  const user = await requireAuthUser();
  await logUserEvent(user.id, USER_EVENT_TYPES.recommendationClicked, {
    animeId,
  });
}

export async function logRecommendationAdded(animeId: string, status: string) {
  const user = await requireAuthUser();
  await logUserEvent(user.id, USER_EVENT_TYPES.recommendationAdded, {
    animeId,
    metadata: { status },
  });
}

export async function dismissRecommendation(animeId: string) {
  const user = await requireAuthUser();
  await logUserEvent(user.id, USER_EVENT_TYPES.recommendationDismissed, {
    animeId,
  });
}

export async function loadRecommendationsForUser(userId: string) {
  if (!isEmbeddingConfigured()) {
    return { configured: false as const, items: [] };
  }

  const items = await getUserRecommendations(userId);
  return { configured: true as const, items };
}
