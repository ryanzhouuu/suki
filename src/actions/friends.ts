"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import {
  getFriendshipBetween,
  searchProfilesWithFriendship,
  type FriendSearchResult,
} from "@/lib/friends/queries";
import { createClient } from "@/lib/supabase/server";

export type FriendsActionState = {
  error?: string;
};

function revalidateFriendPaths(username?: string) {
  revalidatePath("/friends");
  if (username) {
    revalidatePath(`/u/${username}`);
    revalidatePath(`/friends/compare/${username}`);
  }
}

export async function searchUsers(
  query: string,
): Promise<{ users: FriendSearchResult[]; error?: string }> {
  try {
    const { user } = await requireProfile();
    const users = await searchProfilesWithFriendship(query, user.id);
    return { users };
  } catch (e) {
    return {
      users: [],
      error: e instanceof Error ? e.message : "Search failed.",
    };
  }
}

export async function sendFriendRequest(
  recipientUserId: string,
): Promise<FriendsActionState> {
  try {
    const { user } = await requireProfile();

    if (recipientUserId === user.id) {
      return { error: "You cannot add yourself." };
    }

    const supabase = await createClient();
    const existing = await getFriendshipBetween(user.id, recipientUserId);

    if (existing?.status === "accepted") {
      return { error: "You are already friends." };
    }
    if (existing?.status === "blocked") {
      return { error: "Cannot send a friend request." };
    }
    if (existing?.status === "pending" && existing.requester_id === user.id) {
      return { error: "Friend request already sent." };
    }

    const now = new Date().toISOString();

    if (
      existing?.status === "pending" &&
      existing.requester_id === recipientUserId
    ) {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", responded_at: now })
        .eq("id", existing.id);

      if (error) return { error: error.message };

      await logUserEvent(user.id, USER_EVENT_TYPES.friendRequestAccepted, {
        metadata: { friendship_id: existing.id, recipient_id: recipientUserId },
      });

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", recipientUserId)
        .single();

      revalidateFriendPaths(profile?.username);
      return {};
    }

    if (existing?.status === "pending") {
      return { error: "They already sent you a request — accept it instead." };
    }

    if (existing?.status === "declined") {
      const { error } = await supabase
        .from("friendships")
        .update({
          requester_id: user.id,
          recipient_id: recipientUserId,
          status: "pending",
          responded_at: null,
        })
        .eq("id", existing.id);

      if (error) return { error: error.message };

      await logUserEvent(user.id, USER_EVENT_TYPES.friendRequestSent, {
        metadata: { friendship_id: existing.id, recipient_id: recipientUserId },
      });

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", recipientUserId)
        .single();

      revalidateFriendPaths(profile?.username);
      return {};
    }

    const { data: inserted, error } = await supabase
      .from("friendships")
      .insert({
        requester_id: user.id,
        recipient_id: recipientUserId,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "A friend request already exists." };
      }
      return { error: error.message };
    }

    await logUserEvent(user.id, USER_EVENT_TYPES.friendRequestSent, {
      metadata: {
        friendship_id: inserted?.id,
        recipient_id: recipientUserId,
      },
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", recipientUserId)
      .single();

    revalidateFriendPaths(profile?.username);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not send request.",
    };
  }
}

export async function respondToFriendRequest(
  friendshipId: string,
  response: "accept" | "decline",
): Promise<FriendsActionState> {
  try {
    const { user } = await requireProfile();
    const supabase = await createClient();

    const { data: row } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", friendshipId)
      .maybeSingle();

    if (!row || row.recipient_id !== user.id || row.status !== "pending") {
      return { error: "Request not found." };
    }

    const now = new Date().toISOString();
    const status = response === "accept" ? "accepted" : "declined";

    const { error } = await supabase
      .from("friendships")
      .update({ status, responded_at: now })
      .eq("id", friendshipId);

    if (error) return { error: error.message };

    await logUserEvent(
      user.id,
      response === "accept"
        ? USER_EVENT_TYPES.friendRequestAccepted
        : USER_EVENT_TYPES.friendRequestDeclined,
      {
        metadata: {
          friendship_id: friendshipId,
          requester_id: row.requester_id,
        },
      },
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", row.requester_id)
      .single();

    revalidateFriendPaths(profile?.username);
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Could not respond to request.",
    };
  }
}

export async function cancelFriendRequest(
  friendshipId: string,
): Promise<FriendsActionState> {
  try {
    const { user } = await requireProfile();
    const supabase = await createClient();

    const { data: row } = await supabase
      .from("friendships")
      .select("recipient_id")
      .eq("id", friendshipId)
      .eq("requester_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (!row) return { error: "Request not found." };

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", row.recipient_id)
      .single();

    revalidateFriendPaths(profile?.username);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not cancel request.",
    };
  }
}

export async function removeFriend(
  friendshipId: string,
): Promise<FriendsActionState> {
  try {
    const { user } = await requireProfile();
    const supabase = await createClient();

    const { data: row } = await supabase
      .from("friendships")
      .select("requester_id, recipient_id")
      .eq("id", friendshipId)
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .maybeSingle();

    if (!row) return { error: "Friendship not found." };

    const otherId =
      row.requester_id === user.id ? row.recipient_id : row.requester_id;

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", otherId)
      .single();

    revalidateFriendPaths(profile?.username);
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not remove friend.",
    };
  }
}
