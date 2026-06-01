import Link from "next/link";

import type { FriendWithProfile } from "@/lib/friends/queries";

type FriendCardProps = {
  friend: FriendWithProfile;
};

export function FriendCard({ friend }: FriendCardProps) {
  const { profile } = friend;
  const displayName = profile.display_name || profile.username;

  return (
    <li className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
      <Link
        href={`/u/${profile.username}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-semibold text-on-accent">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{displayName}</p>
          <p className="truncate text-sm text-muted">@{profile.username}</p>
        </div>
      </Link>
      <Link
        href={`/friends/compare/${profile.username}`}
        className="shrink-0 text-sm font-medium text-accent hover:underline"
      >
        Compare taste
      </Link>
    </li>
  );
}
