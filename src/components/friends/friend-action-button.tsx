"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  cancelFriendRequest,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/actions/friends";
import { Button } from "@/components/ui/button";
import type { FriendshipUiStatus } from "@/lib/friends/relationship";

type FriendActionButtonProps = {
  targetUserId: string;
  targetUsername: string;
  friendshipId: string | null;
  status: FriendshipUiStatus;
  isOwnProfile: boolean;
};

export function FriendActionButton({
  targetUserId,
  targetUsername,
  friendshipId,
  status,
  isOwnProfile,
}: FriendActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (isOwnProfile) return null;

  function refresh() {
    startTransition(() => router.refresh());
  }

  if (status === "friends" && friendshipId) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href={`/friends/compare/${targetUsername}`}>
          <Button size="sm" variant="primary" type="button">
            Compare taste
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={async () => {
            await removeFriend(friendshipId);
            refresh();
          }}
        >
          Remove friend
        </Button>
      </div>
    );
  }

  if (status === "pending_outgoing" && friendshipId) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          await cancelFriendRequest(friendshipId);
          refresh();
        }}
      >
        Cancel request
      </Button>
    );
  }

  if (status === "pending_incoming" && friendshipId) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={async () => {
            await respondToFriendRequest(friendshipId, "accept");
            refresh();
          }}
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={async () => {
            await respondToFriendRequest(friendshipId, "decline");
            refresh();
          }}
        >
          Decline
        </Button>
      </div>
    );
  }

  if (status === "blocked" || status === "declined") {
    return (
      <p className="text-sm text-muted">
        {status === "blocked" ? "Cannot send request." : "Request declined."}
      </p>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={async () => {
        await sendFriendRequest(targetUserId);
        refresh();
      }}
    >
      Add friend
    </Button>
  );
}
