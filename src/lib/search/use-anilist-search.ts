"use client";

import { useEffect, useMemo, useState } from "react";

import type { AniListMediaSummary } from "@/lib/anilist/types";

import { buildSearchApiUrl } from "./api-url";
import { anilistSearchErrorMessage } from "./errors";

const SEARCH_DEBOUNCE_MS = 350;

type UseAnilistSearchOptions = {
  query: string;
  genres: string[];
  genreKey: string;
  format?: string | null;
  sort?: string | null;
};

export function useAnilistSearch({
  query,
  genres: _genres,
  genreKey,
  format = null,
  sort = null,
}: UseAnilistSearchOptions) {
  const [results, setResults] = useState<AniListMediaSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const normalizedGenres = useMemo(
    () => (genreKey.length > 0 ? genreKey.split("\0").filter(Boolean) : []),
    [genreKey],
  );
  const isActive =
    trimmedQuery.length > 0 || _genres.length > 0 || Boolean(format);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      void (async () => {
        try {
          const res = await fetch(
            buildSearchApiUrl(trimmedQuery, normalizedGenres, { format, sort }),
          );
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
  }, [trimmedQuery, genreKey, format, sort, isActive, normalizedGenres]);

  return {
    results: isActive ? results : [],
    loading: isActive ? loading : false,
    error: isActive ? error : null,
    isActive,
    trimmedQuery,
  };
}
