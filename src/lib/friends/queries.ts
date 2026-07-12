import { escapeIlikePattern } from "@/lib/db/ilike";
import {
  friendshipStatusForViewer,
  type FriendshipUiStatus,
} from "@/lib/friends/relationship";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type FriendProfile = Pick<
  Tables<"profiles">,
  "user_id" | "username" | "display_name" | "avatar_url" | "bio"
>;

export type FriendWithProfile = {
  friendship: Tables<"friendships">;
  profile: FriendProfile;
};

export type FriendSearchResult = FriendProfile & {
  status: FriendshipUiStatus;
  friendshipId: string | null;
};

export async function getFriendshipBetween(
  viewerId: string,
  otherUserId: string,
): Promise<Tables<"friendships"> | null> {
  const supabase = await createClient();

  const { data: asRequester } = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", viewerId)
    .eq("recipient_id", otherUserId)
    .in("status", ["pending", "accepted", "blocked", "declined"])
    .maybeSingle();

  if (asRequester) return asRequester;

  const { data: asRecipient } = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", otherUserId)
    .eq("recipient_id", viewerId)
    .in("status", ["pending", "accepted", "blocked", "declined"])
    .maybeSingle();

  return asRecipient;
}

export function mergeFriendshipRows(
  viewerId: string,
  asRequester: Tables<"friendships">[],
  asRecipient: Tables<"friendships">[],
): Map<string, Tables<"friendships">> {
  const map = new Map<string, Tables<"friendships">>();
  for (const row of [...asRequester, ...asRecipient]) {
    const otherId =
      row.requester_id === viewerId ? row.recipient_id : row.requester_id;
    map.set(otherId, row);
  }
  return map;
}

export async function getFriendshipsBetweenViewerAndUsers(
  viewerId: string,
  otherUserIds: string[],
): Promise<Map<string, Tables<"friendships">>> {
  if (otherUserIds.length === 0) return new Map();

  const supabase = await createClient();
  const statuses = ["pending", "accepted", "blocked", "declined"] as const;

  const [asRequester, asRecipient] = await Promise.all([
    supabase
      .from("friendships")
      .select("*")
      .eq("requester_id", viewerId)
      .in("recipient_id", otherUserIds)
      .in("status", [...statuses]),
    supabase
      .from("friendships")
      .select("*")
      .eq("recipient_id", viewerId)
      .in("requester_id", otherUserIds)
      .in("status", [...statuses]),
  ]);

  return mergeFriendshipRows(
    viewerId,
    asRequester.data ?? [],
    asRecipient.data ?? [],
  );
}

async function profilesByUserIds(
  userIds: string[],
): Promise<Map<string, FriendProfile>> {
  if (userIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url, bio")
    .in("user_id", userIds);
  if (error) throw error;

  return new Map((data ?? []).map((p) => [p.user_id, p]));
}

function otherUserId(
  friendship: Tables<"friendships">,
  viewerId: string,
): string {
  return friendship.requester_id === viewerId
    ? friendship.recipient_id
    : friendship.requester_id;
}

export async function listAcceptedFriends(
  userId: string,
): Promise<FriendWithProfile[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("responded_at", { ascending: false, nullsFirst: false });
  if (error) throw error;

  const friendships = rows ?? [];
  const otherIds = friendships.map((f) => otherUserId(f, userId));
  const profileMap = await profilesByUserIds(otherIds);

  return friendships
    .map((friendship) => {
      const profile = profileMap.get(otherUserId(friendship, userId));
      if (!profile) return null;
      return { friendship, profile };
    })
    .filter((f): f is FriendWithProfile => Boolean(f));
}

export async function listFriendRequests(userId: string): Promise<{
  incoming: FriendWithProfile[];
  outgoing: FriendWithProfile[];
}> {
  const supabase = await createClient();

  const [incomingResult, outgoingResult] = await Promise.all([
    supabase
      .from("friendships")
      .select("*")
      .eq("recipient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("friendships")
      .select("*")
      .eq("requester_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);
  if (incomingResult.error) throw incomingResult.error;
  if (outgoingResult.error) throw outgoingResult.error;

  const incomingRows = incomingResult.data ?? [];
  const outgoingRows = outgoingResult.data ?? [];

  const incomingProfiles = await profilesByUserIds(
    incomingRows.map((f) => f.requester_id),
  );
  const outgoingProfiles = await profilesByUserIds(
    outgoingRows.map((f) => f.recipient_id),
  );

  const incoming: FriendWithProfile[] = incomingRows
    .map((friendship) => {
      const profile = incomingProfiles.get(friendship.requester_id);
      if (!profile) return null;
      return { friendship, profile };
    })
    .filter((f): f is FriendWithProfile => Boolean(f));

  const outgoing: FriendWithProfile[] = outgoingRows
    .map((friendship) => {
      const profile = outgoingProfiles.get(friendship.recipient_id);
      if (!profile) return null;
      return { friendship, profile };
    })
    .filter((f): f is FriendWithProfile => Boolean(f));

  return { incoming, outgoing };
}

export async function searchProfiles(
  query: string,
  excludeUserId: string,
  limit = 10,
): Promise<FriendProfile[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const pattern = `%${escapeIlikePattern(trimmed)}%`;

  const { data } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url, bio")
    .neq("user_id", excludeUserId)
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(limit);

  return data ?? [];
}

export async function searchProfilesWithFriendship(
  query: string,
  viewerId: string,
  limit = 10,
): Promise<FriendSearchResult[]> {
  const profiles = await searchProfiles(query, viewerId, limit);
  const friendshipMap = await getFriendshipsBetweenViewerAndUsers(
    viewerId,
    profiles.map((p) => p.user_id),
  );

  return profiles.map((profile) => {
    const friendship = friendshipMap.get(profile.user_id) ?? null;
    return {
      ...profile,
      status: friendshipStatusForViewer(friendship, viewerId),
      friendshipId: friendship?.id ?? null,
    };
  });
}
