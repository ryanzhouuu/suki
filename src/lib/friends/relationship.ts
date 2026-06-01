import type { Tables } from "@/types/database";

export type FriendshipUiStatus =
  | "none"
  | "friends"
  | "pending_outgoing"
  | "pending_incoming"
  | "declined"
  | "blocked";

export function friendshipStatusForViewer(
  row: Tables<"friendships"> | null,
  viewerId: string,
): FriendshipUiStatus {
  if (!row) return "none";

  if (row.status === "accepted") return "friends";
  if (row.status === "blocked") return "blocked";
  if (row.status === "declined") return "declined";

  if (row.status === "pending") {
    if (row.requester_id === viewerId) return "pending_outgoing";
    if (row.recipient_id === viewerId) return "pending_incoming";
  }

  return "none";
}

export function assertAcceptedFriends(
  row: Tables<"friendships"> | null,
  viewerId: string,
  friendUserId: string,
): void {
  if (!row || row.status !== "accepted") {
    throw new Error("You must be friends to compare taste.");
  }

  const participants = new Set([row.requester_id, row.recipient_id]);
  if (!participants.has(viewerId) || !participants.has(friendUserId)) {
    throw new Error("Invalid friendship.");
  }
}
