"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { resolveAnimeForLibraryEntry, addAnimeEntry } from "@/actions/library";
import { requireAuthUser, requireProfile } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { getRecipientAnimeStatus } from "@/lib/friend-recommendations/recipient-library";
import {
  canRespondToRecommendation,
  describeRecipientLibraryStatus,
  statusForResponse,
  validateRecommendationNote,
  type RecommendationResponse,
} from "@/lib/friend-recommendations/view-model";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { createClient } from "@/lib/supabase/server";

export type FriendRecommendationActionState = {
  error?: string;
  message?: string;
};

async function assertAcceptedFriend(
  viewerId: string,
  otherUserId: string,
): Promise<string | null> {
  if (viewerId === otherUserId) return "You cannot recommend to yourself.";
  const friendship = await getFriendshipBetween(viewerId, otherUserId);
  if (friendship?.status !== "accepted") {
    return "You can only recommend to friends.";
  }
  return null;
}

/** Send a single anime to one friend with an optional note. */
export async function sendAnimeRecommendation(
  recipientUserId: string,
  anilistId: number,
  note: string | null,
): Promise<FriendRecommendationActionState> {
  try {
    const { user } = await requireProfile();

    const friendError = await assertAcceptedFriend(user.id, recipientUserId);
    if (friendError) return { error: friendError };

    const noteResult = validateRecommendationNote(note);
    if (!noteResult.ok) return { error: noteResult.error };

    const anime = await resolveAnimeForLibraryEntry(anilistId);
    const supabase = await createClient();

    const { error } = await supabase.from("anime_recommendations").insert({
      sender_id: user.id,
      recipient_id: recipientUserId,
      anime_id: anime.id,
      note: noteResult.note,
    });

    if (error) {
      if (error.code === "23505") {
        return { error: "You've already recommended this to them." };
      }
      return { error: error.message };
    }

    after(() => {
      void logUserEvent(user.id, USER_EVENT_TYPES.friendRecommendationSent, {
        animeId: anime.id,
        metadata: { recipient_id: recipientUserId },
      });
      revalidatePath("/friends");
    });

    return { message: "Recommendation sent." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not send recommendation.",
    };
  }
}

/** Recipient adds the title to plan-to-watch or dismisses the recommendation. */
export async function respondToAnimeRecommendation(
  recommendationId: string,
  response: RecommendationResponse,
): Promise<FriendRecommendationActionState> {
  try {
    const user = await requireAuthUser();
    const supabase = await createClient();

    const { data: rec } = await supabase
      .from("anime_recommendations")
      .select("id, status, anime:anime_id(id, anilist_id)")
      .eq("id", recommendationId)
      .eq("recipient_id", user.id)
      .maybeSingle();

    if (!rec || !rec.anime) return { error: "Recommendation not found." };
    if (!canRespondToRecommendation(rec.status)) {
      return { error: "This recommendation was already handled." };
    }

    if (response === "add") {
      const { data: existing } = await supabase
        .from("user_anime_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("anime_id", rec.anime.id)
        .maybeSingle();

      // Don't clobber an existing entry's status (e.g. already watching/completed).
      if (!existing) {
        const addResult = await addAnimeEntry(rec.anime.anilist_id, "plan_to_watch");
        if (addResult.error) return { error: addResult.error };
      }
    }

    const { error } = await supabase
      .from("anime_recommendations")
      .update({
        status: statusForResponse(response),
        responded_at: new Date().toISOString(),
      })
      .eq("id", recommendationId);

    if (error) return { error: error.message };

    if (response === "add") {
      after(() => {
        void logUserEvent(user.id, USER_EVENT_TYPES.friendRecommendationAdded, {
          animeId: rec.anime!.id,
        });
      });
    }

    revalidatePath("/friends");
    return {
      message:
        response === "add" ? "Added to your plan-to-watch." : "Dismissed.",
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not update recommendation.",
    };
  }
}

/** Clear the unread badge: mark the viewer's unseen pending recs as seen. */
export async function markRecommendationsSeen(): Promise<void> {
  try {
    const user = await requireAuthUser();
    const supabase = await createClient();
    await supabase
      .from("anime_recommendations")
      .update({ seen_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .is("seen_at", null);
  } catch {
    /* badge clearing is best-effort */
  }
}

export type RecipientAnimeHint = {
  message: string | null;
  error?: string;
};

/**
 * Sender-side hint: does the chosen friend already have this title logged?
 * Returns a friendly sentence (or null) once an accepted friendship is verified.
 */
export async function getRecipientAnimeHint(
  recipientUserId: string,
  anilistId: number,
): Promise<RecipientAnimeHint> {
  try {
    const { user } = await requireProfile();

    const friendError = await assertAcceptedFriend(user.id, recipientUserId);
    if (friendError) return { message: null, error: friendError };

    const anime = await resolveAnimeForLibraryEntry(anilistId);
    const status = await getRecipientAnimeStatus(recipientUserId, anime.id);
    return { message: describeRecipientLibraryStatus(status) };
  } catch (e) {
    return {
      message: null,
      error: e instanceof Error ? e.message : "Could not load friend status.",
    };
  }
}
