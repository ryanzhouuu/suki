"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { assertAcceptedFriends } from "@/lib/friends/relationship";
import { generateCollaborativeRecommendations } from "@/lib/recommendations/collaborative-generate";
import {
  DEFAULT_COLLABORATIVE_RECOMMENDATION_PREFS,
  isCollaborativeRecommendationMode,
  type CollaborativeRecommendationMode,
} from "@/lib/recommendations/collaborative-types";
import { generateRecommendations } from "@/lib/recommendations/generate";
import { isEmbeddingConfigured } from "@/lib/recommendations/embedding-provider";
import {
  getCollaborativeRecommendations,
  getUserRecommendations,
} from "@/lib/recommendations/queries";
import { parseRecommendationRequestPrefs } from "@/lib/recommendations/request-prefs";
import { runResilientOperation } from "@/lib/resilience/operation";
import { checkRecommendationRefreshThrottle } from "@/lib/throttle/recommendation-refresh";

export type RecommendationsActionState = {
  error?: string;
  message?: string;
  referenceId?: string;
  retryable?: boolean;
};

export async function refreshRecommendations(
  _prev: RecommendationsActionState,
  formData: FormData,
): Promise<RecommendationsActionState> {
  const user = await requireAuthUser();

  if (!isEmbeddingConfigured()) {
    const result = await runResilientOperation(
      {
        route: "/recommendations",
        operation: "generate_recommendations",
        dependency: "openai",
        userId: user.id,
      },
      () => {
        throw new Error("OPENAI_API_KEY is not set.");
      },
    );
    if (result.status === "loaded") {
      throw new Error("Expected configuration failure.");
    }
    return {
      error: result.failure.safeMessage,
      referenceId: result.failure.correlationId.slice(0, 8),
      retryable: result.failure.retryable,
    };
  }

  const throttle = await checkRecommendationRefreshThrottle(user.id, "personal");
  if (!throttle.allowed) {
    return {
      error: `Please wait ${throttle.retryAfterSeconds} seconds before refreshing again.`,
    };
  }

  const parsed = parseRecommendationRequestPrefs(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const generation = await runResilientOperation(
    {
      route: "/recommendations",
      operation: "generate_recommendations",
      dependency: "openai",
      userId: user.id,
    },
    () =>
      generateRecommendations(user.id, {
        force: true,
        prefs: parsed.prefs,
      }),
  );
  if (generation.status === "unavailable") {
    return {
      error: generation.failure.safeMessage,
      referenceId: generation.failure.correlationId.slice(0, 8),
      retryable: generation.failure.retryable,
    };
  }

  await logUserEvent(user.id, USER_EVENT_TYPES.recommendationRefreshed, {
    metadata: { requestPrefs: parsed.prefs },
  });
  revalidatePath("/recommendations");
  revalidatePath("/home");
  return { message: "Recommendations updated." };
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

  const items = await getUserRecommendations(userId, {
    includeLibraryStatus: true,
  });
  return { configured: true as const, items };
}

export async function refreshCollaborativeRecommendations(
  _prev: RecommendationsActionState,
  formData: FormData,
): Promise<RecommendationsActionState> {
  const user = await requireAuthUser();

  if (!isEmbeddingConfigured()) {
    return {
      error: "Recommendations are not available right now. Please try again later.",
    };
  }

  const friendUserId = String(formData.get("friendUserId") ?? "").trim();
  if (!friendUserId) {
    return { error: "Missing friend user id." };
  }

  const rawMode = String(
    formData.get("collaborationMode") ??
      DEFAULT_COLLABORATIVE_RECOMMENDATION_PREFS.mode,
  ).trim();
  if (!isCollaborativeRecommendationMode(rawMode)) {
    return { error: "Invalid collaborative mode." };
  }

  const friendship = await getFriendshipBetween(user.id, friendUserId);
  try {
    assertAcceptedFriends(friendship, user.id, friendUserId);
  } catch {
    return { error: "You must be friends to generate collaborative picks." };
  }

  const throttle = await checkRecommendationRefreshThrottle(user.id, "collaborative");
  if (!throttle.allowed) {
    return {
      error: `Please wait ${throttle.retryAfterSeconds} seconds before refreshing again.`,
    };
  }

  const parsed = parseRecommendationRequestPrefs(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  try {
    await generateCollaborativeRecommendations(user.id, friendUserId, {
      force: true,
      prefs: { ...parsed.prefs, mode: rawMode },
    });
    await logUserEvent(
      user.id,
      USER_EVENT_TYPES.collaborativeRecommendationRefreshed,
      {
        metadata: {
          friendUserId,
          mode: rawMode,
          requestPrefs: parsed.prefs,
        },
      },
    );

    const friendUsername = String(formData.get("friendUsername") ?? "").trim();
    if (friendUsername) {
      revalidatePath(`/friends/compare/${friendUsername}/recommendations`);
      revalidatePath(`/friends/compare/${friendUsername}`);
    } else {
      revalidatePath("/friends");
    }

    return { message: "Collaborative recommendations updated." };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Failed to refresh collaborative recommendations.",
    };
  }
}

export async function loadCollaborativeRecommendationsForUsers(
  viewerId: string,
  friendUserId: string,
  mode: CollaborativeRecommendationMode,
) {
  if (!isEmbeddingConfigured()) {
    return { configured: false as const, items: [] };
  }

  const items = await getCollaborativeRecommendations(viewerId, friendUserId, mode);
  return { configured: true as const, items };
}
