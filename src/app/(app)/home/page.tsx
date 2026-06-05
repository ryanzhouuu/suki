import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { DiscoverRow } from "@/components/home/discover-row";
import { HomeHero } from "@/components/home/home-hero";
import { RecommendationsPreview } from "@/components/home/recommendations-preview";
import { WidePageFrame } from "@/components/layout/page-frame";
import { getLatestAnime, getPopularAnime } from "@/lib/anilist/discover";
import { requireProfile } from "@/lib/auth/session";
import { pickHeroHeadline } from "@/lib/home/hero-copy";
import { getUserLibraryEntries } from "@/lib/library/queries";
import { getNextComparisonPair } from "@/lib/ranking/prompt";
import { getCompletedSeriesForUser } from "@/lib/series/queries";

function uniqueCoverUrls(
  items: { coverUrl: string | null }[],
  limit: number,
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const item of items) {
    if (!item.coverUrl || seen.has(item.coverUrl)) continue;
    seen.add(item.coverUrl);
    urls.push(item.coverUrl);
    if (urls.length >= limit) break;
  }
  return urls;
}

export default async function HomePage() {
  const { user, profile } = await requireProfile();

  const [watching, completedSeries, pair, latest, popular] = await Promise.all([
    getUserLibraryEntries(user.id, "watching"),
    getCompletedSeriesForUser(user.id),
    getNextComparisonPair(user.id),
    getLatestAnime().catch(() => []),
    getPopularAnime().catch(() => []),
  ]);

  const greetingName = profile.display_name || profile.username;
  const heroBackdropUrls = uniqueCoverUrls([...latest, ...popular], 6);
  const headline = pickHeroHeadline(user.id);

  return (
    <WidePageFrame className="space-y-10 sm:space-y-14">
      <HomeHero
        greetingName={greetingName}
        watchingCount={watching.length}
        headline={headline}
        backdropUrls={heroBackdropUrls}
      />

      {latest.length > 0 ? (
        <div className="animate-rise [animation-delay:60ms]">
          <DiscoverRow eyebrow="Discover" title="Latest" items={latest} />
        </div>
      ) : null}

      {popular.length > 0 ? (
        <div className="animate-rise [animation-delay:120ms]">
          <DiscoverRow eyebrow="Discover" title="Popular" items={popular} />
        </div>
      ) : null}

      <RecommendationsPreview userId={user.id} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="animate-rise lg:col-span-2 [animation-delay:240ms]">
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
                  <li key={entry.id}>
                    <Link
                      href={`/anime/${entry.anime.anilist_id}`}
                      className="group flex items-center gap-3 rounded-card border border-line bg-surface p-3 transition-all hover:border-accent hover:shadow-[0_8px_24px_-16px_rgb(var(--shadow-color)/0.35)]"
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

        {pair && completedSeries.length >= 2 ? (
          <aside className="animate-rise flex flex-col overflow-hidden rounded-card border border-accent/35 bg-linear-to-br from-accent-soft via-surface to-surface p-6 shadow-[0_16px_48px_-28px_rgb(var(--shadow-color)/0.4)] [animation-delay:180ms]">
            <p className="eyebrow">Ranking prompt</p>
            <p className="mt-2 text-balance font-display text-lg font-medium leading-snug text-ink sm:text-xl">
              {pair.left.canonical_title}{" "}
              <span className="text-accent">vs</span>{" "}
              {pair.right.canonical_title}
            </p>
            <p className="mt-2 text-sm text-muted">
              Which did you enjoy more? It only takes a tap.
            </p>
            <Link
              href="/ranking"
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong"
            >
              Decide now →
            </Link>
          </aside>
        ) : completedSeries.length < 2 ? (
          <aside className="animate-rise flex flex-col justify-center rounded-card border border-dashed border-line-strong bg-surface/50 p-6 [animation-delay:180ms]">
            <p className="eyebrow">Ranking</p>
            <p className="mt-2 text-sm text-muted">
              Complete anime in at least two series to unlock pairwise rankings.
            </p>
          </aside>
        ) : null}
      </div>
    </WidePageFrame>
  );
}
