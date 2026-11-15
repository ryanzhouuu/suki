import Link from "next/link";

import { RecommendFromProfileButton } from "@/components/friend-recommendations/recommend-from-profile-button";
import { FriendActionButton } from "@/components/friends/friend-action-button";
import { TasteSimilarityBadge } from "@/components/friends/taste-similarity-badge";
import { CreditLine } from "@/components/home/credit-line";
import { ArtworkField, heroGhostClass } from "@/components/home/hero-frame";
import { ProfileEditSection } from "@/components/profile/profile-edit-section";
import { ProfileVisibilityBadge } from "@/components/profile/profile-visibility-badge";
import { ShareButton } from "@/components/share/share-button";
import { env } from "@/lib/env";
import type { FriendshipUiStatus } from "@/lib/friends/relationship";
import type { TasteSimilarityResult } from "@/lib/friends/taste-similarity";
import type { Tables } from "@/types/database";

/** Hero art borrowed from the profile's top-ranked series, credited on the frame. */
export type ProfileHeroArt = {
  url: string;
  title: string;
};

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
  /** Used when the profile has no uploaded banner. */
  fallbackArt?: ProfileHeroArt | null;
  /** Spacing that pulls the full-bleed hero up under the app header. */
  className?: string;
};

/**
 * Full-bleed profile hero: the user's banner (or their #1 series' backdrop)
 * as the frame, with identity and actions on a left-weighted shade.
 */
export function ProfileHeader({
  profile,
  isOwnProfile,
  isEditing,
  viewerId,
  friendshipId,
  friendshipStatus,
  tasteSimilarity,
  snapshot,
  fallbackArt = null,
  className = "",
}: ProfileHeaderProps) {
  const displayName = profile.display_name || profile.username;
  const borrowed = profile.banner_url ? null : fallbackArt;
  const art = profile.banner_url ?? borrowed?.url ?? null;

  return (
    <header
      className={`full-bleed relative isolate flex flex-col justify-end overflow-hidden ${
        art ? "min-h-[26rem] sm:min-h-[30rem]" : "min-h-[20rem]"
      } ${className}`}
    >
      <ArtworkField src={art} />

      <div className="relative z-10 w-full px-4 pt-24 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-white/20 sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-accent font-display text-4xl font-medium text-on-accent ring-2 ring-white/20 sm:h-32 sm:w-32 sm:text-5xl">
                {displayName[0]?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="text-balance font-display text-4xl font-medium leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                  {displayName}
                </h1>
                {tasteSimilarity ? (
                  <TasteSimilarityBadge similarity={tasteSimilarity} size="md" />
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-white/70">
                <span>@{profile.username}</span>
                {isOwnProfile ? (
                  <ProfileVisibilityBadge visibility={profile.profile_visibility} />
                ) : null}
              </div>
              <CreditLine
                onArt
                className="mt-3"
                parts={[
                  { text: `${snapshot.tracked} tracked`, tone: "strong" },
                  { text: `${snapshot.completed} completed` },
                  { text: `${snapshot.ranked} ranked` },
                ]}
              />
              {profile.bio ? (
                <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/80">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                {isOwnProfile ? (
                  !isEditing ? (
                    <>
                      <ProfileEditSection profile={profile} editing={false} />
                      <ShareButton
                        className={`${heroGhostClass} gap-2`}
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
                    className="inline-flex min-h-11 items-center rounded-full border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    Sign in to connect
                  </Link>
                )}
              </div>
            </div>
          </div>

          {borrowed ? (
            <p className="text-sm text-white/55 lg:max-w-56 lg:text-right">
              Backdrop from <span className="text-white/85">{borrowed.title}</span>, ranked #1
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
