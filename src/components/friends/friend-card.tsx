import Link from "next/link";

import type { FriendWithProfile } from "@/lib/friends/queries";

type FriendCardProps = {
  friend: FriendWithProfile;
};

export function FriendCard({ friend }: FriendCardProps) {
  const { profile } = friend;
  const displayName = profile.display_name || profile.username;

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-all hover:border-accent hover:shadow-[0_16px_40px_-28px_rgb(var(--shadow-color)/0.5)]">
      <div
        className="h-16 bg-linear-to-br from-accent-soft via-surface-2 to-surface"
        aria-hidden
      />
      <div className="-mt-8 flex flex-1 flex-col px-4 pb-4">
        <Link href={`/u/${profile.username}`} className="flex items-end gap-3">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-surface"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xl font-semibold text-on-accent ring-4 ring-surface">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 pb-1">
            <p className="truncate font-medium text-ink transition-colors group-hover:text-accent">
              {displayName}
            </p>
            <p className="truncate text-sm text-muted">@{profile.username}</p>
          </div>
        </Link>

        {profile.bio ? (
          <p className="mt-3 line-clamp-2 text-sm text-muted">{profile.bio}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 pt-1">
          <Link
            href={`/u/${profile.username}`}
            className="rounded-full border border-line-strong px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Profile
          </Link>
          <Link
            href={`/friends/compare/${profile.username}`}
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong"
          >
            Compare taste
          </Link>
        </div>
      </div>
    </li>
  );
}
