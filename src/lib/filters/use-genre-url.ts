"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { parseGenreParams } from "@/lib/filters/parse-genre-params";

export function useGenreFromUrl(): string[] {
  const searchParams = useSearchParams();
  return parseGenreParams(searchParams.getAll("genre"));
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
