import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { describeActivity, type FeedItem } from "@/lib/friends/activity-feed";
import { formatRelativeTime } from "@/lib/friends/relative-time";

type ActivityFeedItemProps = {
  item: FeedItem;
  /** Compact variant for the Home teaser (smaller covers, tighter spacing). */
  compact?: boolean;
};

function ActorAvatar({ item }: { item: FeedItem }) {
  const name = item.actor.displayName || item.actor.username;
  if (item.actor.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.actor.avatarUrl}
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

export function ActivityFeedItem({ item, compact = false }: ActivityFeedItemProps) {
  const name = item.actor.displayName || item.actor.username;

  return (
    <li className="flex gap-3 rounded-card border border-line bg-surface p-3 sm:p-4">
      <Link href={`/u/${item.actor.username}`} className="shrink-0">
        <ActorAvatar item={item} />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">
          <Link
            href={`/u/${item.actor.username}`}
            className="font-semibold hover:text-accent"
          >
            {name}
          </Link>{" "}
          <span className="text-muted">{describeActivity(item)}</span>
        </p>
        <p className="mt-0.5 text-xs text-faint">
          {formatRelativeTime(item.createdAt)}
        </p>

        {item.refs.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {item.refs.map((ref, i) => (
              <Link
                key={`${item.id}:${i}`}
                href={ref.href}
                title={ref.title}
                className="transition-transform hover:-translate-y-0.5"
              >
                <AnimePoster
                  src={ref.coverImageUrl}
                  alt={ref.title}
                  size={compact ? "sm" : "md"}
                />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
