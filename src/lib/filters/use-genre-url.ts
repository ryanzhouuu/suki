"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { parseGenreParams } from "@/lib/filters/parse-genre-params";

/** Stable string key for genre URL params (for effect deps). */
export function genreFilterKey(genres: string[]): string {
  return genres.join("\0");
}

export function useGenreFromUrl(): string[] {
  const searchParams = useSearchParams();
  const genreKey = searchParams.getAll("genre").join("\0");

  return useMemo(
    () => parseGenreParams(searchParams.getAll("genre")),
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
