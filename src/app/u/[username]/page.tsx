import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimePoster } from "@/components/anime/anime-poster";
import { RankedList } from "@/components/ranking/ranked-list";
import { STATUS_LABELS } from "@/lib/constants";
import { getPublicProfileData } from "@/lib/profiles/queries";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const data = await getPublicProfileData(username);

  if (!data) {
    notFound();
  }

  const { profile, entries, rankings, stats } = data;
  const displayName = profile.display_name || profile.username;
  const watching = entries.filter((e) => e.status === "watching").slice(0, 6);
  const watchlist = entries
    .filter((e) => e.status === "plan_to_watch")
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 text-2xl font-semibold dark:bg-zinc-800">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          <p className="text-zinc-500">@{profile.username}</p>
          {profile.bio ? (
            <p className="mt-2 max-w-xl text-sm text-zinc-700 dark:text-zinc-300">
              {profile.bio}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-zinc-500">
            {stats.total} tracked · {stats.completed} completed ·{" "}
            {stats.watching} watching
          </p>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-medium">Top ranked</h2>
        <RankedList rankings={rankings} />
      </section>

      {watching.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">Watching now</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {watching.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/anime/${entry.anime.anilist_id}`}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800"
                >
                  <AnimePoster
                    src={entry.anime.cover_image_url}
                    alt={entry.anime.romaji_title}
                    size="sm"
                  />
                  <span className="truncate text-sm font-medium">
                    {entry.anime.english_title || entry.anime.romaji_title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {watchlist.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-medium">
            {STATUS_LABELS.plan_to_watch}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {watchlist.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/anime/${entry.anime.anilist_id}`}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800"
                >
                  <AnimePoster
                    src={entry.anime.cover_image_url}
                    alt={entry.anime.romaji_title}
                    size="sm"
                  />
                  <span className="truncate text-sm font-medium">
                    {entry.anime.english_title || entry.anime.romaji_title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="underline">
          Back to {displayName === profile.username ? "app" : "Suki"}
        </Link>
      </p>
    </div>
  );
}
