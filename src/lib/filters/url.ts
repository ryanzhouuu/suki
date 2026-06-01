"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { normalizeGenreParams } from "@/lib/anilist/genres";

import { genreFilterKey } from "./genre";

export function useGenreFromUrl(): string[] {
  const searchParams = useSearchParams();
  const genreKey = searchParams.getAll("genre").join("\0");

  return useMemo(
    () => normalizeGenreParams(searchParams.getAll("genre")),
    [genreKey],
  );
}

export function useSetGenreInUrl() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(
    (genres: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("genre");
      for (const g of genres) {
        params.append("genre", g);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );
}

/** Genre filter state synced with `?genre=` URL params. */
export function useGenreFilters() {
  const genres = useGenreFromUrl();
  const setGenres = useSetGenreInUrl();
  const genreKey = genreFilterKey(genres);

  return {
    genres,
    setGenres,
    genreKey,
    isFiltering: genres.length > 0,
  };
}
