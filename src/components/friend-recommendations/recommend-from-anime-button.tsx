"use client";

import Link from "next/link";
import { useState } from "react";

import { RecommendComposer } from "@/components/friend-recommendations/recommend-composer";
import { RecommendDialog } from "@/components/friend-recommendations/recommend-dialog";
import { Button } from "@/components/ui/button";

export type FriendOption = {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type RecommendFromAnimeButtonProps = {
  anilistId: number;
  animeTitle: string;
  friends: FriendOption[];
};

function FriendAvatar({ friend }: { friend: FriendOption }) {
  const name = friend.displayName || friend.username;
  if (friend.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={friend.avatarUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-on-accent">
      {name[0]?.toUpperCase()}
    </div>
  );
}

export function RecommendFromAnimeButton({
  anilistId,
  animeTitle,
  friends,
}: RecommendFromAnimeButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FriendOption | null>(null);

  function close() {
    setOpen(false);
    setSelected(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className="h-4 w-4"
        >
          <path d="M13 4.5a2.5 2.5 0 1 1 .7 1.74l-4.3 2.15a2.5 2.5 0 0 1 0 1.22l4.3 2.15a2.5 2.5 0 1 1-.67 1.34l-4.3-2.15a2.5 2.5 0 1 1 0-3.9l4.3-2.15A2.5 2.5 0 0 1 13 4.5Z" />
        </svg>
        Recommend to a friend
      </Button>

      <RecommendDialog
        open={open}
        onClose={close}
        title="Recommend to a friend"
        subtitle={animeTitle}
      >
        {friends.length === 0 ? (
          <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
            <p className="font-display text-lg text-ink">No friends yet</p>
            <p className="mt-1 text-sm text-muted">
              Add a friend first, then you can pass titles their way.
            </p>
            <Link href="/friends" className="mt-4 inline-block">
              <Button size="sm" type="button" onClick={close}>
                Find friends
              </Button>
            </Link>
          </div>
        ) : selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
              <FriendAvatar friend={selected} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {selected.displayName || selected.username}
                </p>
                <p className="truncate text-xs text-muted">
                  @{selected.username}
                </p>
              </div>
            </div>
            <RecommendComposer
              recipientUserId={selected.userId}
              anilistId={anilistId}
              animeTitle={animeTitle}
              recipientName={selected.displayName || selected.username}
              onReset={() => setSelected(null)}
              resetLabel="Pick another friend"
            />
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">
              Choose a friend
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {friends.map((friend) => (
                <li key={friend.userId}>
                  <button
                    type="button"
                    onClick={() => setSelected(friend)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent hover:bg-surface-2"
                  >
                    <FriendAvatar friend={friend} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {friend.displayName || friend.username}
                      </p>
                      <p className="truncate text-xs text-muted">
                        @{friend.username}
                      </p>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-faint"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </RecommendDialog>
    </>
  );
}
