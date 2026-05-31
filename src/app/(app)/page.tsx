import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import { requireProfile } from "@/lib/auth/session";
import { getUserLibraryEntries } from "@/lib/library/queries";
import { getNextComparisonPair } from "@/lib/ranking/prompt";

export default async function HomePage() {
  const { user } = await requireProfile();

  const [watching, completed, pair] = await Promise.all([
    getUserLibraryEntries(user.id, "watching"),
    getUserLibraryEntries(user.id, "completed"),
    getNextComparisonPair(user.id),
  ]);

  return (
    <div className="space-y-10 pb-20 sm:pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Pick up where you left off.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Continue watching</h2>
          <Link href="/library?status=watching" className="text-sm text-zinc-600 hover:underline">
            See all
          </Link>
        </div>
        {watching.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nothing in progress.{" "}
            <Link href="/search" className="font-medium underline">
              Search for anime
            </Link>{" "}
            to start watching.
          </p>
        ) : (
          <ul className="space-y-2">
            {watching.slice(0, 5).map((entry) => {
              const title =
                entry.anime.english_title || entry.anime.romaji_title;
              return (
                <li key={entry.id}>
                  <Link
                    href={`/anime/${entry.anime.anilist_id}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <AnimePoster
                      src={entry.anime.cover_image_url}
                      alt={title}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-xs text-zinc-500">
                        {entry.progress_episodes}
                        {entry.anime.episodes
                          ? ` / ${entry.anime.episodes} episodes`
                          : " episodes"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pair && completed.length >= 2 ? (
        <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium">Ranking prompt</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Compare{" "}
            <strong>
              {pair.left.english_title || pair.left.romaji_title}
            </strong>{" "}
            vs{" "}
            <strong>
              {pair.right.english_title || pair.right.romaji_title}
            </strong>
          </p>
          <Link
            href="/ranking"
            className="mt-3 inline-block text-sm font-medium underline"
          >
            Open ranking
          </Link>
        </section>
      ) : completed.length < 2 ? (
        <section className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Complete at least two anime to unlock pairwise rankings.
          </p>
        </section>
      ) : null}

      <section>
        <Link
          href="/search"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search anime
        </Link>
      </section>
    </div>
  );
}
