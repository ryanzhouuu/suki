"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { addAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { GenreFilter } from "@/components/filters/genre-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAniListDisplayTitle } from "@/lib/anilist/display";
import type { AniListMediaSummary } from "@/lib/anilist/types";
import {
  genreFilterKey,
  useGenreFromUrl,
  useSetGenreInUrl,
} from "@/lib/filters/use-genre-url";
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";

function buildSearchUrl(query: string, genres: string[]): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  for (const g of genres) {
    params.append("genre", g);
  }
  const qs = params.toString();
  return qs ? `/api/search?${qs}` : "/api/search";
}

export function SearchPanel() {
  const genresFromUrl = useGenreFromUrl();
  const genreKey = genreFilterKey(genresFromUrl);
  const setGenresInUrl = useSetGenreInUrl();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListMediaSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed && genresFromUrl.length === 0) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      void (async () => {
        try {
          const res = await fetch(buildSearchUrl(query, genresFromUrl));
          if (cancelled) return;
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? "Search failed");
          }
          const data = (await res.json()) as { media: AniListMediaSummary[] };
          if (cancelled) return;
          setResults(data.media);
        } catch (e) {
          if (cancelled) return;
          setError(
            e instanceof Error && e.message.includes("429")
              ? "AniList is busy. Wait a moment and try again."
              : e instanceof Error
                ? e.message
                : "Could not reach AniList. Try again.",
          );
          setResults([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, genreKey, genresFromUrl]);

  function quickAdd(anilistId: number, status: AnimeEntryStatus) {
    startTransition(async () => {
      await addAnimeEntry(anilistId, status);
    });
  }

  const hasQuery = query.trim().length > 0;
  const hasGenres = genresFromUrl.length > 0;
  const isActive = hasQuery || hasGenres;

  return (
    <div className="space-y-7 pb-24 sm:pb-10">
      <div>
        <p className="eyebrow">Discover</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Search</h1>
        <p className="mt-2 text-muted">
          Find anime via AniList and add them to your library in seconds.
        </p>
      </div>

      <div className="sticky top-18 z-10 -mx-1 space-y-3 bg-paper/80 px-1 py-1 backdrop-blur-md">
        <Input
          type="search"
          placeholder="Search by title…  e.g. Frieren, Cowboy Bebop"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <GenreFilter selected={genresFromUrl} onChange={setGenresInUrl} />
      </div>

      {loading ? (
        <p className="text-sm text-muted">Searching…</p>
      ) : null}
      {error ? (
        <p
          className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!loading && isActive && results.length === 0 && !error ? (
        <p className="text-sm text-muted">
          {hasQuery
            ? `No results for “${query.trim()}”.`
            : "No results for the selected genres."}
        </p>
      ) : null}

      {!isActive && !loading ? (
        <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-display text-xl text-ink">Start typing or pick genres</p>
          <p className="mt-1 text-sm text-muted">
            Search by title, browse by genre, or combine both.
          </p>
        </div>
      ) : null}

      <ul className="space-y-3">
        {results.map((media) => {
          const title = getAniListDisplayTitle(media.title);
          const mediaGenres = media.genres ?? [];
          return (
            <li
              key={media.id}
              className="group flex gap-4 rounded-card border border-line bg-surface p-3.5 transition-colors hover:border-accent"
            >
              <Link href={`/anime/${media.id}`} className="shrink-0">
                <AnimePoster
                  src={media.coverImage?.large ?? null}
                  alt={title}
                  size="sm"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/anime/${media.id}`}
                  className="font-medium text-ink transition-colors hover:text-accent"
                >
                  {title}
                </Link>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-faint">
                  {[media.format, media.seasonYear, media.episodes && `${media.episodes} eps`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {mediaGenres.length > 0 ? (
                  <p className="mt-1 text-xs text-muted">
                    {mediaGenres.slice(0, 4).join(" · ")}
                  </p>
                ) : null}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => quickAdd(media.id, "plan_to_watch")}
                  >
                    {STATUS_LABELS.plan_to_watch}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => quickAdd(media.id, "watching")}
                  >
                    {STATUS_LABELS.watching}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => quickAdd(media.id, "completed")}
                  >
                    {STATUS_LABELS.completed}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
