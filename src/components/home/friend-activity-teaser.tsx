import Link from "next/link";

import { ActivityFeedItem } from "@/components/friends/activity-feed-item";
import { getFriendActivityFeed } from "@/lib/friends/activity";

type FriendActivityTeaserProps = {
  userId: string;
};

const TEASER_COUNT = 3;

export async function FriendActivityTeaser({ userId }: FriendActivityTeaserProps) {
  const { items } = await getFriendActivityFeed(userId, { limit: 20 });
  if (items.length === 0) return null;

  return (
    <section className="animate-rise [animation-delay:300ms]">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow">Social</p>
          <h2 className="mt-1 text-2xl font-semibold">Friend activity</h2>
        </div>
        <Link
          href="/friends"
          className="shrink-0 text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          See all →
        </Link>
      </div>
      <ul className="space-y-3">
        {items.slice(0, TEASER_COUNT).map((item) => (
          <ActivityFeedItem key={item.id} item={item} compact />
        ))}
      </ul>
    </section>
  );
}
