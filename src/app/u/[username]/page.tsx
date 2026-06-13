import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileActivityPanel } from "@/components/profile/profile-activity-panel";
import { ProfileAnimeSection } from "@/components/profile/profile-anime-section";
import { ProfileEditSection } from "@/components/profile/profile-edit-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileRestrictedCard } from "@/components/profile/profile-restricted-card";
import { ProfileStatsPanel } from "@/components/profile/profile-stats-panel";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { WidePageFrame } from "@/components/layout/page-frame";
import { RankedList } from "@/components/ranking/ranked-list";
import { getAuthUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { getFriendshipBetween } from "@/lib/friends/queries";
import { friendshipStatusForViewer } from "@/lib/friends/relationship";
import { getTasteSimilarity } from "@/lib/friends/taste-similarity";
import { getProfileByUsername, getPublicProfileData } from "@/lib/profiles/queries";
import { getShareCardData } from "@/lib/profiles/share-card";
import { getGenresBySeriesIds } from "@/lib/series/genres";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const card = await getShareCardData(username);
  if (!card) return {};

  const base: Metadata = { metadataBase: new URL(env.siteUrl()) };

  if (!card.isPublic) {
    return {
      ...base,
      title: "Private profile",
      description:
        "Track anime, build your watchlist, and rank your favorites on Suki.",
    };
  }

  const detail = [
    card.topGenres.length > 0 ? card.topGenres.join(" · ") : null,
    card.completedCount > 0 ? `${card.completedCount} completed` : null,
  ].filter(Boolean);
  const description =
    detail.length > 0
      ? `${detail.join(" · ")} — taste profile on Suki.`
      : `${card.displayName}'s taste profile on Suki.`;

  return {
    ...base,
    title: `${card.displayName} (@${card.username})`,
    description,
    openGraph: {
      title: `${card.displayName} (@${card.username}) on Suki`,
      description,
      type: "profile",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PublicProfilePageProps) {
  const { username } = await params;
  const { edit } = await searchParams;
  const viewer = await getAuthUser();

  const baseProfile = await getProfileByUsername(username);
  if (!baseProfile) {
    notFound();
  }

  const isOwnProfile = viewer?.id === baseProfile.user_id;

  let friendshipId: string | null = null;
  let friendshipStatus = friendshipStatusForViewer(null, viewer?.id ?? "");
  let tasteSimilarity = null;

  if (viewer && viewer.id !== baseProfile.user_id) {
    const friendship = await getFriendshipBetween(viewer.id, baseProfile.user_id);
    friendshipId = friendship?.id ?? null;
    friendshipStatus = friendshipStatusForViewer(friendship, viewer.id);

    if (friendshipStatus === "friends") {
      tasteSimilarity = await getTasteSimilarity(viewer.id, baseProfile.user_id);
    }
  }

  const canSeeFull =
    isOwnProfile ||
    baseProfile.profile_visibility === "public" ||
    (baseProfile.profile_visibility === "friends_only" &&
      friendshipStatus === "friends");

  if (!canSeeFull) {
    return (
      <WidePageFrame className={viewer ? "min-w-0" : "min-w-0 py-10"}>
        <ProfileRestrictedCard profile={baseProfile} showSignIn={!viewer} />
        {!viewer ? (
          <p className="border-t border-line pt-8 text-center text-sm text-muted">
            <Link href="/" className="font-medium text-accent hover:underline">
              ← Back to Suki
            </Link>
          </p>
        ) : null}
      </WidePageFrame>
    );
  }

  const data = await getPublicProfileData(username, {
    viewerId: viewer?.id ?? null,
  });

  if (!data) {
    notFound();
  }

  const { profile, entries, rankings, stats } = data;
  const isEditing = isOwnProfile && edit === "1";

  const seriesIds = rankings.map((r) => r.series_id);
  const genresMap =
    seriesIds.length > 0 ? await getGenresBySeriesIds(seriesIds) : new Map();
  const genresBySeriesId = Object.fromEntries(genresMap);

  const watching = entries.filter((e) => e.status === "watching").slice(0, 8);
  const watchlist = entries
    .filter((e) => e.status === "plan_to_watch")
    .slice(0, 8);
  const completedHighlights = entries
    .filter((e) => e.status === "completed")
    .sort((a, b) => {
      const aScore = a.personal_score ? Number(a.personal_score) : -1;
      const bScore = b.personal_score ? Number(b.personal_score) : -1;
      if (bScore !== aScore) return bScore - aScore;
      const aDate = a.completed_at ?? "";
      const bDate = b.completed_at ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 8);

  const libraryCount = watching.length + watchlist.length + completedHighlights.length;
  const hasLibrarySections = libraryCount > 0;

  const overviewContent = (
    <ProfileStatsPanel
      library={stats.library}
      taste={stats.taste}
      ranking={stats.ranking}
      watchStyle={stats.watchStyle}
      activitySlot={
        <ProfileActivityPanel
          activity={stats.activity}
          isOwnProfile={isOwnProfile}
          className="xl:col-span-6"
        />
      }
    />
  );

  const libraryContent = hasLibrarySections ? (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      <ProfileAnimeSection
        eyebrow="Now watching"
        title="Watching"
        entries={watching}
        layout="list"
      />
      <ProfileAnimeSection
        eyebrow="Up next"
        title="Plan to watch"
        entries={watchlist}
        layout="list"
      />
      <ProfileAnimeSection
        eyebrow="Completed"
        title="Highlights"
        entries={completedHighlights}
        layout="list"
        showScore
        showCompletedDate
      />
    </div>
  ) : (
    <section className="rounded-card border border-dashed border-line-strong bg-surface/50 p-8 text-center">
      <p className="text-sm text-muted">No public library entries yet.</p>
    </section>
  );

  const rankingContent = (
    <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <p className="eyebrow">Top ranked</p>
      <h2 className="mb-4 mt-1 text-2xl font-semibold">Favorites</h2>
      <RankedList rankings={rankings} genresBySeriesId={genresBySeriesId} />
    </section>
  );

  return (
    <WidePageFrame
      className={`min-w-0 space-y-6 sm:space-y-8 ${viewer ? "pb-6 sm:pb-0" : "py-10"}`}
    >
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        viewerId={viewer?.id ?? null}
        friendshipId={friendshipId}
        friendshipStatus={friendshipStatus}
        tasteSimilarity={tasteSimilarity}
        snapshot={{
          tracked: stats.library.total,
          completed: stats.library.completed,
          ranked: stats.ranking.totalRanked,
        }}
      />

      {isEditing ? (
        <ProfileEditSection profile={profile} editing />
      ) : (
        <ProfileTabs
          tabs={[
            { id: "overview", label: "Overview", content: overviewContent },
            {
              id: "library",
              label: "Library",
              count: libraryCount,
              content: libraryContent,
            },
            {
              id: "rankings",
              label: "Rankings",
              count: rankings.length,
              content: rankingContent,
            },
          ]}
        />
      )}

      {!viewer ? (
        <p className="border-t border-line pt-8 text-center text-sm text-muted">
          <Link href="/" className="font-medium text-accent hover:underline">
            ← Back to Suki
          </Link>
        </p>
      ) : null}
    </WidePageFrame>
  );
}
