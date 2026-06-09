"use client";

import { useState, useTransition } from "react";

import { loadFriendActivity } from "@/actions/friends";
import { ActivityFeedItem } from "@/components/friends/activity-feed-item";
import { Button } from "@/components/ui/button";
import type { FeedItem } from "@/lib/friends/activity-feed";

type FriendActivityFeedProps = {
  initialItems: FeedItem[];
  initialCursor: string | null;
};

export function FriendActivityFeed({
  initialItems,
  initialCursor,
}: FriendActivityFeedProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    setError(null);
    startTransition(async () => {
      try {
        const page = await loadFriendActivity(cursor);
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
      } catch {
        setError("Couldn't load more activity. Try again.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
        <p className="font-display text-xl text-ink">No recent activity</p>
        <p className="mt-1 text-sm text-muted">
          When your friends complete, plan, or rank anime, it shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((item) => (
          <ActivityFeedItem key={item.id} item={item} />
        ))}
      </ul>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {cursor ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
