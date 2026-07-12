import { Suspense } from "react";

import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { AsyncSectionUnavailable } from "@/components/ui/async-section";
import {
  AiringTracker,
  AiringTrackerSkeleton,
} from "@/components/home/airing-tracker";
import { DiscoverRow } from "@/components/home/discover-row";
import { FriendActivityTeaser } from "@/components/home/friend-activity-teaser";
import { HomeHero } from "@/components/home/home-hero";
import { RecommendationsPreview } from "@/components/home/recommendations-preview";
import { WatchlistShuffle } from "@/components/library/watchlist-shuffle";
import { WidePageFrame } from "@/components/layout/page-frame";
import { getLatestAnime, getPopularAnime, getTrendingAnime } from "@/lib/anilist/discover";
import { requireProfile } from "@/lib/auth/session";
import { getRandomBackground } from "@/lib/home/background";
import { pickHeroHeadline } from "@/lib/home/hero-copy";
import { getUserLibraryEntries } from "@/lib/library/queries";
import { runResilientOperation } from "@/lib/resilience";
import { getNextComparisonPair } from "@/lib/ranking/prompt";
import { getCompletedSeriesForUser } from "@/lib/series/queries";

// ——— Streaming sections (render concurrently with the page shell) ———

type DiscoverRowSectionProps = {
  delay: string;
  operation: string;
  title: string;
  load: typeof getTrendingAnime;
};

async function DiscoverRowSection({
  delay,
  operation,
  title,
  load,
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
      <DiscoverRow eyebrow="Discover" title={title} items={result.data} />
    </div>
  );
}

function DiscoverRowSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-4">
        <div className="h-3 w-14 animate-pulse rounded bg-surface-2" />
        <div className="mt-1 h-7 w-24 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="-mx-4 flex gap-3 overflow-hidden px-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="w-29 shrink-0 sm:w-32">
            <div className="aspect-2/3 w-full animate-pulse rounded-lg bg-surface-2" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
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
  const planToWatch = result.data;
  if (planToWatch.length === 0) return null;
  return (
    <div className="animate-rise [animation-delay:160ms]">
      <WatchlistShuffle entries={planToWatch} compact />
    </div>
  );
}

async function RankingSection({ userId }: { userId: string }) {
  const result = await runResilientOperation(
    {
      route: "/home",
      operation: "load_ranking_prompt",
      dependency: "supabase",
      userId,
    },
    () =>
      Promise.all([
        getCompletedSeriesForUser(userId),
        getNextComparisonPair(userId),
      ]),
  );
  if (result.status === "unavailable") {
    return (
      <AsyncSectionUnavailable
        title="Your ranking prompt is temporarily unavailable"
        description={result.failure.safeMessage}
        referenceId={result.failure.correlationId.slice(0, 8)}
        retryable={result.failure.retryable}
      />
    );
  }
  const [completedSeries, pair] = result.data;

  if (pair && completedSeries.length >= 2) {
    return (
      <aside className="animate-rise flex flex-col gap-4 overflow-hidden rounded-card border border-accent/35 bg-linear-to-br from-accent-soft via-surface to-surface p-6 shadow-[0_16px_48px_-28px_rgb(var(--shadow-color)/0.4)] sm:flex-row sm:items-center sm:justify-between sm:gap-6 [animation-delay:180ms]">
        <div className="min-w-0">
          <p className="eyebrow">Ranking prompt</p>
          <p className="mt-2 text-balance font-display text-lg font-medium leading-snug text-ink sm:text-xl">
            {pair.left.canonical_title}{" "}
            <span className="text-accent">vs</span>{" "}
            {pair.right.canonical_title}
          </p>
          <p className="mt-2 text-sm text-muted">
            Which did you enjoy more? It only takes a tap.
          </p>
        </div>
        <Link
          href="/ranking"
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong"
        >
          Decide now →
        </Link>
      </aside>
    );
  }

  if (completedSeries.length < 2) {
    return (
      <aside className="animate-rise flex flex-col justify-center rounded-card border border-dashed border-line-strong bg-surface/50 p-6 [animation-delay:180ms]">
        <p className="eyebrow">Ranking</p>
        <p className="mt-2 text-sm text-muted">
          Complete anime in at least two series to unlock pairwise rankings.
        </p>
      </aside>
    );
  }

  return null;
}

// ——— Page ———

export default async function HomePage() {
  const { user, profile } = await requireProfile();
  const watching = await getUserLibraryEntries(user.id, "watching");

  const greetingName = profile.display_name || profile.username;
  const headline = pickHeroHeadline(user.id);
  const bg = getRandomBackground();

  return (
    <WidePageFrame className="space-y-10 sm:space-y-14">
      <HomeHero
        greetingName={greetingName}
        watchingCount={watching.length}
        headline={headline}
        bgSrc={bg}
      />

      <div className="space-y-10">
        <Suspense fallback={<DiscoverRowSkeleton />}>
          <DiscoverRowSection
            delay="60ms"
            operation="load_discover_trending"
            title="Trending"
            load={getTrendingAnime}
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
        <WatchlistSection userId={user.id} />
      </Suspense>

      <Suspense fallback={null}>
        <RecommendationsPreview userId={user.id} />
      </Suspense>

      <Suspense fallback={null}>
        <FriendActivityTeaser userId={user.id} />
      </Suspense>

      <Suspense fallback={<AiringTrackerSkeleton />}>
        <AiringTracker userId={user.id} />
      </Suspense>

      <section className="animate-rise [animation-delay:240ms]">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Your queue</p>
            <h2 className="mt-1 text-2xl font-semibold">Continue watching</h2>
          </div>
          <Link
            href="/library?status=watching"
            className="shrink-0 text-sm font-medium text-muted transition-colors hover:text-accent"
          >
            See all →
          </Link>
        </div>
        {watching.length === 0 ? (
          <div className="rounded-card border border-dashed border-line-strong bg-surface/40 p-8 text-center">
            <p className="text-sm text-muted">
              Nothing in progress yet.{" "}
              <Link
                href="/search"
                className="font-semibold text-accent hover:underline"
              >
                Search for anime
              </Link>{" "}
              to start watching.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {watching.slice(0, 6).map((entry) => {
              const title =
                entry.anime.english_title || entry.anime.romaji_title;
              const total = entry.anime.episodes;
              const pct = total
                ? Math.min(
                    100,
                    Math.round((entry.progress_episodes / total) * 100),
                  )
                : 0;
              return (
                <li key={entry.id} className="min-w-0">
                  <Link
                    href={`/anime/${entry.anime.anilist_id}`}
                    className="group flex w-full min-w-0 items-center gap-3 rounded-card border border-line bg-surface p-3 transition-all hover:border-accent hover:shadow-[0_8px_24px_-16px_rgb(var(--shadow-color)/0.35)]"
                  >
                    <AnimePoster
                      src={entry.anime.cover_image_url}
                      alt={title}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink transition-colors group-hover:text-accent">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {entry.progress_episodes}
                        {total ? ` / ${total} eps` : " eps"}
                      </p>
                      {total ? (
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-accent transition-[width]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Suspense fallback={null}>
        <RankingSection userId={user.id} />
      </Suspense>
    </WidePageFrame>
  );
}
