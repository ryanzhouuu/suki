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
    <div className="space-y-6 pb-20 sm:pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Find anime via AniList and add them to your library.
        </p>
      </div>

      <Input
        type="search"
        placeholder="Search by title…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {loading ? (
        <p className="text-sm text-zinc-500">Searching…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && query && results.length === 0 && !error ? (
        <p className="text-sm text-zinc-500">No results.</p>
      ) : null}

      <ul className="space-y-3">
        {results.map((media) => {
          const title = getAniListDisplayTitle(media.title);
          return (
            <li
              key={media.id}
              className="flex gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
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
                  className="font-medium hover:underline"
                >
                  {title}
                </Link>
                <p className="text-xs text-zinc-500">
                  {[media.format, media.seasonYear, media.episodes && `${media.episodes} eps`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
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
