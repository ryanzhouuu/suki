"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import { addAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAniListDisplayTitle } from "@/lib/anilist/display";
import type { AniListMediaSummary } from "@/lib/anilist/types";
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListMediaSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = (await res.json()) as { media: AniListMediaSummary[] };
      setResults(data.media);
    } catch {
      setError("Could not reach AniList. Try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  function quickAdd(anilistId: number, status: AnimeEntryStatus) {
    startTransition(async () => {
      await addAnimeEntry(anilistId, status);
    });
  }

  return (
    <div className="space-y-7 pb-24 sm:pb-10">
      <div>
        <p className="eyebrow">Discover</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Search</h1>
        <p className="mt-2 text-muted">
          Find anime via AniList and add them to your library in seconds.
        </p>
      </div>

      <div className="sticky top-18 z-10 -mx-1 bg-paper/80 px-1 py-1 backdrop-blur-md">
        <Input
          type="search"
          placeholder="Search by title…  e.g. Frieren, Cowboy Bebop"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
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

      {!loading && query && results.length === 0 && !error ? (
        <p className="text-sm text-muted">No results for “{query}”.</p>
      ) : null}

      {!query && !loading ? (
        <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-display text-xl text-ink">Start typing to explore</p>
          <p className="mt-1 text-sm text-muted">
            Thousands of titles, powered by AniList.
          </p>
        </div>
      ) : null}

      <ul className="space-y-3">
        {results.map((media) => {
          const title = getAniListDisplayTitle(media.title);
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
