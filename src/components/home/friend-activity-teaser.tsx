import { ActivityFeedItem } from "@/components/friends/activity-feed-item";
import { SectionHeading } from "@/components/home/credit-line";
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
      <SectionHeading label="Friends" title="Friend activity" href="/friends" />
      <ul className="space-y-3">
        {items.slice(0, TEASER_COUNT).map((item) => (
          <ActivityFeedItem key={item.id} item={item} compact />
        ))}
      </ul>
    </section>
  );
}
