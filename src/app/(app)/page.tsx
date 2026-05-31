import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { requireProfile } from "@/lib/auth/session";
import { getUserLibraryEntries } from "@/lib/library/queries";
import { getNextComparisonPair } from "@/lib/ranking/prompt";

export default async function HomePage() {
  const { user, profile } = await requireProfile();

  const [watching, completed, pair] = await Promise.all([
    getUserLibraryEntries(user.id, "watching"),
    getUserLibraryEntries(user.id, "completed"),
    getNextComparisonPair(user.id),
  ]);

  const greetingName = profile.display_name || profile.username;

  return (
    <div className="space-y-12 pb-24 sm:pb-10">
      <section className="animate-rise">
        <p className="eyebrow">Welcome back, {greetingName}</p>
        <h1 className="mt-2 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] sm:text-6xl">
          Pick up right where you{" "}
          <span className="italic text-accent">left off</span>.
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Track what you watch, build a watchlist, and shape a ranking you
          actually trust — one quick comparison at a time.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong"
          >
            Search anime
          </Link>
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Open ranking
          </Link>
        </div>
      </section>

      {pair && completed.length >= 2 ? (
        <section className="overflow-hidden rounded-card border border-accent/30 bg-accent-soft p-6 sm:p-7">
          <p className="eyebrow">Ranking prompt</p>
          <p className="mt-2 font-display text-2xl font-medium leading-snug text-ink">
            {pair.left.english_title || pair.left.romaji_title}{" "}
            <span className="text-accent">vs</span>{" "}
            {pair.right.english_title || pair.right.romaji_title}
          </p>
          <p className="mt-2 text-sm text-muted">
            Which did you enjoy more? It only takes a tap.
          </p>
          <Link
            href="/ranking"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-strong"
          >
            Decide now
          </Link>
        </section>
      ) : completed.length < 2 ? (
        <section className="rounded-card border border-dashed border-line-strong p-6">
          <p className="text-sm text-muted">
            Complete at least two anime to unlock pairwise rankings.
          </p>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Continue watching</h2>
          <Link
            href="/library?status=watching"
            className="text-sm font-medium text-muted transition-colors hover:text-accent"
          >
            See all →
          </Link>
        </div>
        {watching.length === 0 ? (
          <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
            <p className="text-sm text-muted">
              Nothing in progress yet.{" "}
              <Link href="/search" className="font-semibold text-accent hover:underline">
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
                ? Math.min(100, Math.round((entry.progress_episodes / total) * 100))
                : 0;
              return (
                <li key={entry.id}>
                  <Link
                    href={`/anime/${entry.anime.anilist_id}`}
                    className="group flex items-center gap-3 rounded-card border border-line bg-surface p-3 transition-colors hover:border-accent"
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
                            className="h-full rounded-full bg-accent"
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
    </div>
  );
}
