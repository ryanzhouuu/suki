"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  onSuccess?: () => void;
};

export function FriendActionButton({
  targetUserId,
  targetUsername,
  friendshipId,
  status,
  isOwnProfile,
  onSuccess,
}: FriendActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isOwnProfile) return null;

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function runAction(action: () => Promise<{ error?: string }>) {
    const result = await action();
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setActionError(null);
    onSuccess?.();
    refresh();
  }

  function errorAlert() {
    if (!actionError) return null;
    return (
      <p className="w-full text-sm text-danger" role="alert">
        {actionError}
      </p>
    );
  }

  if (status === "friends" && friendshipId) {
    return (
      <div className="flex flex-col gap-2">
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
            onClick={() => runAction(() => removeFriend(friendshipId))}
          >
            Remove friend
          </Button>
        </div>
        {errorAlert()}
      </div>
    );
  }

  if (status === "pending_outgoing" && friendshipId) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => runAction(() => cancelFriendRequest(friendshipId))}
        >
          Cancel request
        </Button>
        {errorAlert()}
      </div>
    );
  }

  if (status === "pending_incoming" && friendshipId) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              runAction(() => respondToFriendRequest(friendshipId, "accept"))
            }
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              runAction(() => respondToFriendRequest(friendshipId, "decline"))
            }
          >
            Decline
          </Button>
        </div>
        {errorAlert()}
      </div>
    );
  }

  if (status === "blocked") {
    return <p className="text-sm text-muted">Cannot send request.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => runAction(() => sendFriendRequest(targetUserId))}
      >
        Add friend
      </Button>
      {errorAlert()}
    </div>
  );
}
