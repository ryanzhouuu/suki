import Link from "next/link";

import { RecommendFromProfileButton } from "@/components/friend-recommendations/recommend-from-profile-button";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { TasteSimilarityBadge } from "@/components/friends/taste-similarity-badge";
import { ProfileEditSection } from "@/components/profile/profile-edit-section";
import { ProfileVisibilityBadge } from "@/components/profile/profile-visibility-badge";
import { ShareButton } from "@/components/share/share-button";
import { env } from "@/lib/env";
import type { FriendshipUiStatus } from "@/lib/friends/relationship";
import type { TasteSimilarityResult } from "@/lib/friends/taste-similarity";
import type { Tables } from "@/types/database";

type ProfileHeaderProps = {
  profile: Tables<"profiles">;
  isOwnProfile: boolean;
  isEditing: boolean;
  viewerId: string | null;
  friendshipId: string | null;
  friendshipStatus: FriendshipUiStatus;
  tasteSimilarity: TasteSimilarityResult | null;
  snapshot: {
    tracked: number;
    completed: number;
    ranked: number;
  };
};

export function ProfileHeader({
  profile,
  isOwnProfile,
  isEditing,
  viewerId,
  friendshipId,
  friendshipStatus,
  tasteSimilarity,
  snapshot,
}: ProfileHeaderProps) {
  const displayName = profile.display_name || profile.username;
  const subtitle = isOwnProfile
    ? "Your taste profile"
    : "Taste profile";

  const bannerUrl = profile.banner_url;

  return (
    <header className="profile-hero overflow-hidden rounded-card border border-line bg-surface">
      <div className="relative h-28 sm:h-36">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="profile-hero__glow" aria-hidden />
            <div className="profile-hero__hatch" aria-hidden />
            <div
              className="absolute inset-0 bg-linear-to-r from-accent/30 via-accent/12 to-transparent"
              aria-hidden
            />
          </>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent"
          aria-hidden
        />
      </div>
      <div className="relative flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-7">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="-mt-14 h-24 w-24 rounded-full border-4 border-surface object-cover shadow-[0_14px_24px_-18px_rgb(var(--shadow-color)/0.7)] sm:h-28 sm:w-28"
          />
        ) : (
          <div className="-mt-14 flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface bg-accent font-display text-3xl font-semibold text-on-accent shadow-[0_14px_24px_-18px_rgb(var(--shadow-color)/0.7)] sm:h-28 sm:w-28">
            {displayName[0]?.toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="eyebrow">{subtitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold sm:text-4xl">{displayName}</h1>
            {tasteSimilarity ? (
              <TasteSimilarityBadge similarity={tasteSimilarity} size="md" />
            ) : null}
          </div>
          <p className="mt-0.5 text-muted">@{profile.username}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {isOwnProfile ? (
              <ProfileVisibilityBadge visibility={profile.profile_visibility} />
            ) : null}
            <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
              {snapshot.tracked} tracked
            </span>
            <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
              {snapshot.completed} completed
            </span>
            <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
              {snapshot.ranked} ranked
            </span>
          </div>

          {profile.bio ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/85">
              {profile.bio}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {isOwnProfile ? (
              !isEditing ? (
                <>
                  <ProfileEditSection profile={profile} editing={false} />
                  <ShareButton
                    url={`${env.siteUrl()}/u/${profile.username}`}
                    title={`${displayName} on Suki`}
                  />
                </>
              ) : null
            ) : viewerId ? (
              <>
                <FriendActionButton
                  targetUserId={profile.user_id}
                  targetUsername={profile.username}
                  friendshipId={friendshipId}
                  status={friendshipStatus}
                  isOwnProfile={isOwnProfile}
                />
                {friendshipStatus === "friends" ? (
                  <RecommendFromProfileButton
                    recipientUserId={profile.user_id}
                    recipientUsername={profile.username}
                    recipientName={displayName}
                  />
                ) : null}
              </>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-medium text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-ink"
              >
                Sign in to connect
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
