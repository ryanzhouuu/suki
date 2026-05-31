import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPicker } from "@/components/anime/status-picker";
import { AnimePoster } from "@/components/anime/anime-poster";
import { getAuthUser } from "@/lib/auth/session";
import { getAnimeForDisplay } from "@/lib/anime/get-for-display";
import type { AnimeEntryStatus } from "@/lib/constants";
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 pb-20">
      <p className="text-sm">
        <Link href={user ? "/" : "/auth/login"} className="text-zinc-600 hover:underline">
          ← Back
        </Link>
      </p>

      <div className="flex flex-col gap-6 sm:flex-row">
        <AnimePoster src={anime.cover_image_url} alt={title} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {anime.native_title && anime.native_title !== title ? (
            <p className="text-zinc-500">{anime.native_title}</p>
          ) : null}
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {[anime.format, anime.season_year, anime.status]
              .filter(Boolean)
              .join(" · ")}
            {anime.episodes ? ` · ${anime.episodes} episodes` : ""}
          </p>
          {anime.genres.length > 0 ? (
            <p className="mt-2 text-sm text-zinc-500">{anime.genres.join(", ")}</p>
          ) : null}
        </div>
      </div>

      {anime.description ? (
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {anime.description.slice(0, 800)}
          {anime.description.length > 800 ? "…" : ""}
        </p>
      ) : null}

      {user ? (
        <section>
          <h2 className="text-lg font-medium">Your list</h2>
          <StatusPicker
            anilistId={anilistId}
            currentStatus={(entry?.status as AnimeEntryStatus) ?? null}
          />
          {entry ? (
            <p className="mt-2 text-sm text-zinc-500">
              <Link href="/library" className="underline">
                View library
              </Link>
              {entry.status === "completed" ? (
                <>
                  {" · "}
                  <Link href="/ranking" className="underline">
                    Ranking
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-zinc-600">
          <Link href="/auth/login" className="font-medium underline">
            Sign in
          </Link>{" "}
          to track this anime.
        </p>
      )}
    </div>
  );
}
