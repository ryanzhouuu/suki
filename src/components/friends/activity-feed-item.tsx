import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { describeActivity, type FeedItem } from "@/lib/friends/activity-feed";
import { formatRelativeTime } from "@/lib/friends/relative-time";

type ActivityFeedItemProps = {
  item: FeedItem;
  /** Compact variant for the Home teaser (smaller covers, tighter spacing). */
  compact?: boolean;
};

function ActorAvatar({ item, compact }: { item: FeedItem; compact: boolean }) {
  const name = item.actor.displayName || item.actor.username;
  const sizeClass = compact
    ? "h-7 w-7 sm:h-8 sm:w-8"
    : "h-8 w-8 sm:h-9 sm:w-9";
  if (item.actor.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.actor.avatarUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-on-accent`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

export function ActivityFeedItem({ item, compact = false }: ActivityFeedItemProps) {
  const name = item.actor.displayName || item.actor.username;

  return (
    <li className="flex gap-2.5 rounded-card border border-line bg-surface p-2.5 sm:gap-3 sm:p-4">
      <Link href={`/u/${item.actor.username}`} className="shrink-0">
        <ActorAvatar item={item} compact={compact} />
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
          <div className="mt-2 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-0.5 sm:mt-2.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
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
                  size="sm"
                />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
