"use client";

import { useEffect, useState } from "react";

import type { AniListMediaSummary } from "@/lib/anilist/types";

import { buildSearchApiUrl } from "./api-url";
import { anilistSearchErrorMessage } from "./errors";

const SEARCH_DEBOUNCE_MS = 350;

type UseAnilistSearchOptions = {
  query: string;
  genres: string[];
  genreKey: string;
};

export function useAnilistSearch({
  query,
  genres,
  genreKey,
}: UseAnilistSearchOptions) {
  const [results, setResults] = useState<AniListMediaSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const isActive = trimmedQuery.length > 0 || genres.length > 0;

  if (
    !isActive &&
    (results.length > 0 || loading || error !== null)
  ) {
    setResults([]);
    setLoading(false);
    setError(null);
  }

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      void (async () => {
        try {
          const res = await fetch(buildSearchApiUrl(query, genres));
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
          setError(anilistSearchErrorMessage(e));
          setResults([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, genreKey, genres, isActive]);

  return { results, loading, error, isActive, trimmedQuery };
}
