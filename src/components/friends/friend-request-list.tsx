"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  cancelFriendRequest,
  respondToFriendRequest,
} from "@/actions/friends";
import { Button } from "@/components/ui/button";
import type { FriendWithProfile } from "@/lib/friends/queries";

type FriendRequestListProps = {
  incoming: FriendWithProfile[];
  outgoing: FriendWithProfile[];
};

function ProfileRow({
  profile,
  children,
}: {
  profile: FriendWithProfile["profile"];
  children: React.ReactNode;
}) {
  const displayName = profile.display_name || profile.username;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-4">
      <Link
        href={`/u/${profile.username}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{displayName}</p>
          <p className="text-sm text-muted">@{profile.username}</p>
        </div>
      </Link>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}

export function FriendRequestList({
  incoming,
  outgoing,
}: FriendRequestListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {incoming.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Incoming requests</h2>
          <ul className="mt-3 space-y-2">
            {incoming.map(({ friendship, profile }) => (
              <ProfileRow key={friendship.id} profile={profile}>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={async () => {
                    await respondToFriendRequest(friendship.id, "accept");
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
                    await respondToFriendRequest(friendship.id, "decline");
                    refresh();
                  }}
                >
                  Decline
                </Button>
              </ProfileRow>
            ))}
          </ul>
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Sent requests</h2>
          <ul className="mt-3 space-y-2">
            {outgoing.map(({ friendship, profile }) => (
              <ProfileRow key={friendship.id} profile={profile}>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={async () => {
                    await cancelFriendRequest(friendship.id);
                    refresh();
                  }}
                >
                  Cancel
                </Button>
              </ProfileRow>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
