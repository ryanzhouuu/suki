import { matchesAnyGenre } from "@/lib/filters/genre";
import type { LibraryEntry } from "@/lib/library/queries";

export type LibraryFilterOptions = {
  query?: string;
  genres?: string[];
};

export function filterLibraryEntries(
  entries: LibraryEntry[],
  options: LibraryFilterOptions | string = {},
): LibraryEntry[] {
  const opts =
    typeof options === "string" ? { query: options } : options;
  const needle = (opts.query ?? "").trim().toLowerCase();
  const genres = opts.genres ?? [];

  return entries.filter((entry) => {
    const { anime } = entry;

    if (needle) {
      const titles = [
        anime.english_title,
        anime.romaji_title,
        anime.native_title,
      ].filter((t): t is string => Boolean(t));

      if (!titles.some((title) => title.toLowerCase().includes(needle))) {
        return false;
      }
    }

    if (!matchesAnyGenre(anime.genres ?? [], genres)) {
      return false;
    }

    return true;
  });
}
