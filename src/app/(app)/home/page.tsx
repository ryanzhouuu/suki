import { Suspense } from "react";

import { WeeklyDigestCard } from "@/components/digest/weekly-digest-card";
import { AsyncSectionUnavailable } from "@/components/ui/async-section";
import { RouteSkeleton } from "@/components/ui/route-skeleton";
import {
  AiringTracker,
  AiringTrackerSkeleton,
} from "@/components/home/airing-tracker";
import { DiscoverRow } from "@/components/home/discover-row";
import { FriendActivityTeaser } from "@/components/home/friend-activity-teaser";
import { HomeHero, HomeHeroFallback } from "@/components/home/home-hero";
import { InactivityReviewCard } from "@/components/home/inactivity-review-card";
import { InProgressList } from "@/components/home/in-progress-list";
import { RankingSection } from "@/components/home/ranking-section";
import { RecommendationsPreview } from "@/components/home/recommendations-preview";
import { WatchlistShuffle } from "@/components/library/watchlist-shuffle";
import { getLatestAnime, getPopularAnime, getTrendingAnime, getTrendingFeature } from "@/lib/anilist/discover";
import { requireProfile } from "@/lib/auth/session";
import {
  getDevelopmentDigestPreview,
  getOrCreateLatestDigest,
} from "@/lib/digest/snapshot";
import { selectHeroShows } from "@/lib/home/featured";
import { withTmdbHeroArtwork } from "@/lib/tmdb/resolve";
import { getDueInactivityPrompts } from "@/lib/inactivity/queries";
import { getUserLibraryEntries } from "@/lib/library/queries";
import { runResilientOperation } from "@/lib/resilience";

type DiscoverRowSectionProps = {
  delay: string;
  operation: string;
  title: string;
  load: typeof getTrendingAnime;
  ranked?: boolean;
};

async function DiscoverRowSection({
  delay,
  operation,
  title,
  load,
  ranked = false,
}: DiscoverRowSectionProps) {
  const result = await runResilientOperation(
    { route: "/home", operation, dependency: "anilist" },
    load,
  );

  if (result.status === "unavailable") {
    return (
      <AsyncSectionUnavailable
        title={`${title} is temporarily unavailable`}
        description={result.failure.safeMessage}
        referenceId={result.failure.correlationId.slice(0, 8)}
        retryable={result.failure.retryable}
      />
    );
  }

  if (result.data.length === 0) return null;

  return (
    <div className="animate-rise" style={{ animationDelay: delay }}>
      <DiscoverRow title={title} items={result.data} ranked={ranked} />
    </div>
  );
}

function DiscoverRowSkeleton() {
  return (
    <RouteSkeleton label="Loading anime discovery">
      <div className="mb-4">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton mt-1 h-7 w-28 rounded" />
      </div>
      <div className="-mx-4 flex gap-3 overflow-hidden px-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="w-29 shrink-0 sm:w-32">
            <div className="skeleton aspect-2/3 w-full rounded-lg" />
            <div className="skeleton mt-2 h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </RouteSkeleton>
  );
}

async function HomeTrendingHero() {
  const trending = await getTrendingFeature();
  if (!trending) return <HomeHero shows={[]} trending={null} />;
  const [featured] = await withTmdbHeroArtwork([trending]);
  return <HomeHero shows={[]} trending={featured ?? trending} />;
}

async function WatchlistSection({ userId }: { userId: string }) {
  const result = await runResilientOperation(
    {
      route: "/home",
      operation: "load_plan_to_watch_shuffle",
      dependency: "supabase",
      userId,
    },
    () => getUserLibraryEntries(userId, "plan_to_watch"),
  );
  if (result.status === "unavailable") {
    return (
      <AsyncSectionUnavailable
        title="Your watchlist is temporarily unavailable"
        description={result.failure.safeMessage}
        referenceId={result.failure.correlationId.slice(0, 8)}
        retryable={result.failure.retryable}
      />
    );
  }
  if (result.data.length === 0) return null;
  return (
    <div className="animate-rise">
      <WatchlistShuffle entries={result.data} compact />
    </div>
  );
}

async function WeeklyDigestSection({
  userId,
  timezone,
}: {
  userId: string;
  timezone: string | null;
}) {
  const result = await runResilientOperation(
    {
      route: "/home",
      operation: "load_weekly_digest",
      dependency: "supabase",
      userId,
    },
    () => getOrCreateLatestDigest(userId, timezone),
  );
  if (result.status === "unavailable" && process.env.NODE_ENV !== "development") {
    return null;
  }
  const storedDigest = result.status === "loaded" ? result.data : null;
  const digest =
    storedDigest ??
    (process.env.NODE_ENV === "development"
      ? await getDevelopmentDigestPreview(userId, timezone).catch(() => null)
      : null);
  if (!digest || digest.dismissed_at) return null;
  return <WeeklyDigestCard digest={digest} />;
}

async function InactivityReviewSection({ userId }: { userId: string }) {
  const prompts = await getDueInactivityPrompts(userId).catch(() => []);
  if (prompts.length === 0) return null;
  return <InactivityReviewCard prompts={prompts} />;
}

export default async function HomePage() {
  const { user, profile } = await requireProfile();
  const watching = await getUserLibraryEntries(user.id, "watching");
  const shows = await withTmdbHeroArtwork(selectHeroShows(watching));

  return (
    <div>
      {shows.length > 0 ? (
        <HomeHero shows={shows} trending={null} />
      ) : (
        <Suspense fallback={<HomeHeroFallback />}>
          <HomeTrendingHero />
        </Suspense>
      )}

      <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-14 lg:px-8">
        <InProgressList entries={watching} />

        <Suspense fallback={null}>
          <WeeklyDigestSection userId={user.id} timezone={profile.timezone} />
        </Suspense>

        <Suspense fallback={null}>
          <InactivityReviewSection userId={user.id} />
        </Suspense>

        <Suspense fallback={<AiringTrackerSkeleton />}>
          <AiringTracker userId={user.id} />
        </Suspense>

        <Suspense fallback={null}>
          <RecommendationsPreview userId={user.id} />
        </Suspense>

        <div className="space-y-10">
          <p className="credit-line">Across AniList</p>
          <Suspense fallback={<DiscoverRowSkeleton />}>
            <DiscoverRowSection
              delay="60ms"
              operation="load_discover_trending"
              title="Trending"
              load={getTrendingAnime}
              ranked
            />
          </Suspense>
          <Suspense fallback={<DiscoverRowSkeleton />}>
            <DiscoverRowSection
              delay="120ms"
              operation="load_discover_latest"
              title="Latest"
              load={getLatestAnime}
            />
          </Suspense>
          <Suspense fallback={<DiscoverRowSkeleton />}>
            <DiscoverRowSection
              delay="180ms"
              operation="load_discover_popular"
              title="Popular"
              load={getPopularAnime}
            />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <RankingSection userId={user.id} />
        </Suspense>

        <Suspense fallback={null}>
          <WatchlistSection userId={user.id} />
        </Suspense>

        <Suspense fallback={null}>
          <FriendActivityTeaser userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
