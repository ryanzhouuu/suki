import Link from "next/link";

import type { FriendWithProfile } from "@/lib/friends/queries";
import type { TasteSimilarityResult } from "@/lib/friends/taste-similarity";

import { TasteSimilarityBadge } from "./taste-similarity-badge";

type FriendCardProps = {
  friend: FriendWithProfile;
  similarity?: TasteSimilarityResult;
};

export function FriendCard({ friend, similarity }: FriendCardProps) {
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
      <div className="flex shrink-0 flex-col items-end gap-2">
        {similarity ? <TasteSimilarityBadge similarity={similarity} /> : null}
        <Link
          href={`/friends/compare/${profile.username}`}
          className="text-xs font-medium text-accent hover:underline"
        >
          Compare taste
        </Link>
      </div>
    </li>
  );
}
