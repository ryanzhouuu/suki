import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimeLibrarySection } from "@/components/anime/anime-library-section";
import { AnimePoster } from "@/components/anime/anime-poster";
import { getAuthUser } from "@/lib/auth/session";
import { getAnimeForDisplay } from "@/lib/anime/get-for-display";
import { getUserEntryForAnime } from "@/lib/library/queries";

type AnimeDetailPageProps = {
  params: Promise<{ anilistId: string }>;
};

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { anilistId: anilistIdParam } = await params;
  const anilistId = Number(anilistIdParam);

  if (!Number.isFinite(anilistId)) {
    notFound();
  }

  let anime;
  try {
    anime = await getAnimeForDisplay(anilistId);
  } catch {
    notFound();
  }

  const user = await getAuthUser();
  const entry =
    user && anime.id
      ? await getUserEntryForAnime(user.id, anime.id)
      : null;
  const title = anime.english_title || anime.romaji_title;

  const description = anime.description
    ? anime.description.replace(/<[^>]*>/g, "")
    : null;
  const meta = [anime.format, anime.season_year, anime.status]
    .filter(Boolean)
    .map(String);
  if (anime.episodes) meta.push(`${anime.episodes} eps`);

  return (
    <div className="pb-10">
      <div className="relative h-44 w-full overflow-hidden sm:h-64">
        {anime.banner_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.banner_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface-2" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-paper via-paper/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 mx-auto max-w-5xl px-4 pt-5">
          <Link
            href={user ? "/home" : "/"}
            className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-3.5 py-1.5 text-sm font-medium text-ink backdrop-blur-md transition-colors hover:text-accent"
          >
            ← Back
          </Link>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl min-w-0 space-y-9 px-4">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="-mt-16 w-fit shrink-0 overflow-hidden rounded-card border-4 border-paper shadow-[0_18px_50px_-26px_rgb(var(--shadow-color)/0.6)] sm:-mt-24">
            <AnimePoster src={anime.cover_image_url} alt={title} size="lg" />
          </div>
          <div className="min-w-0 flex-1 sm:pt-2">
            <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h1>
            {anime.native_title && anime.native_title !== title ? (
              <p className="mt-1 font-display text-lg text-muted">
                {anime.native_title}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              {meta.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-surface-2 px-2.5 py-1 font-medium uppercase tracking-wide text-muted"
                >
                  {m}
                </span>
              ))}
              {anime.average_score ? (
                <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">
                  ★ {anime.average_score}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {anime.genres.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {anime.genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted"
              >
                {g}
              </span>
            ))}
          </div>
        ) : null}

        {description ? (
          <p className="max-w-2xl leading-relaxed text-ink/85">
            {description.slice(0, 800)}
            {description.length > 800 ? "…" : ""}
          </p>
        ) : null}

        {user ? (
          <AnimeLibrarySection
            anilistId={anilistId}
            entry={entry}
            anime={anime}
          />
        ) : (
          <p className="text-sm text-muted">
            <Link href="/auth/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>{" "}
            to track this anime.
          </p>
        )}
      </div>
    </div>
  );
}
