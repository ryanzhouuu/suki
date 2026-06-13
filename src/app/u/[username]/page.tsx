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
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";
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

  // Independent reads — run together rather than chaining auth → profile.
  const [viewer, baseProfile] = await Promise.all([
    getAuthUser(),
    getProfileByUsername(username),
  ]);
  if (!baseProfile) {
    notFound();
  }

  const isOwnProfile = viewer?.id === baseProfile.user_id;

  let friendshipId: string | null = null;
  let friendshipStatus = friendshipStatusForViewer(null, viewer?.id ?? "");

  if (viewer && viewer.id !== baseProfile.user_id) {
    const friendship = await getFriendshipBetween(viewer.id, baseProfile.user_id);
    friendshipId = friendship?.id ?? null;
    friendshipStatus = friendshipStatusForViewer(friendship, viewer.id);
  }

  const isFriend =
    viewer != null && !isOwnProfile && friendshipStatus === "friends";

  const canSeeFull =
    isOwnProfile ||
    baseProfile.profile_visibility === "public" ||
    (baseProfile.profile_visibility === "friends_only" && isFriend);

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

  // Taste similarity (embeddings + both libraries) is independent of the
  // profile data read — fetch them concurrently.
  const [data, tasteSimilarity] = await Promise.all([
    getPublicProfileData(username, { viewerId: viewer?.id ?? null }),
    isFriend && viewer
      ? getTasteSimilarity(viewer.id, baseProfile.user_id)
      : Promise.resolve(null),
  ]);

  if (!data) {
    notFound();
  }

  const { profile, entries, allRankings, stats } = data;
  const isEditing = isOwnProfile && edit === "1";

  const seriesIds = allRankings.map((r) => r.series_id);
  const genresMap =
    seriesIds.length > 0 ? await getGenresBySeriesIds(seriesIds) : new Map();
  const genresBySeriesId = Object.fromEntries(genresMap);

  const completedSorted = entries
    .filter((e) => e.status === "completed")
    .sort((a, b) => {
      const aScore = a.personal_score ? Number(a.personal_score) : -1;
      const bScore = b.personal_score ? Number(b.personal_score) : -1;
      if (bScore !== aScore) return bScore - aScore;
      const aDate = a.completed_at ?? "";
      const bDate = b.completed_at ?? "";
      return bDate.localeCompare(aDate);
    });

  // Full library grouped by status (entries arrive ordered by updated_at desc).
  const libraryOrder: AnimeEntryStatus[] = [
    "watching",
    "plan_to_watch",
    "completed",
    "paused",
    "dropped",
  ];
  const librarySections = libraryOrder
    .map((status) => ({
      status,
      entries:
        status === "completed"
          ? completedSorted
          : entries.filter((e) => e.status === status),
    }))
    .filter((section) => section.entries.length > 0);

  const libraryCount = entries.length;
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
    <div className="min-w-0 space-y-4">
      {librarySections.map((section) => (
        <ProfileAnimeSection
          key={section.status}
          eyebrow={`${section.entries.length} ${
            section.entries.length === 1 ? "title" : "titles"
          }`}
          title={STATUS_LABELS[section.status]}
          entries={section.entries}
          layout="grid"
          showScore={section.status === "completed"}
          showCompletedDate={section.status === "completed"}
        />
      ))}
    </div>
  ) : (
    <section className="rounded-card border border-dashed border-line-strong bg-surface/50 p-8 text-center">
      <p className="text-sm text-muted">No public library entries yet.</p>
    </section>
  );

  const rankingContent = (
    <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <p className="eyebrow">Full ranking</p>
      <h2 className="mb-4 mt-1 text-2xl font-semibold">Favorites</h2>
      <RankedList
        rankings={allRankings}
        genresBySeriesId={genresBySeriesId}
        editable={isOwnProfile}
      />
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
              count: allRankings.length,
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
