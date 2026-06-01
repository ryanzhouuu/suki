import { filterByGenre } from "@/lib/filters/genre";
import type { LibraryEntry } from "@/lib/library/queries";

export type LibraryFilterOptions = {
  query?: string;
  genres?: string[];
};

function matchesTitleQuery(entry: LibraryEntry, needle: string): boolean {
  const titles = [
    entry.anime.english_title,
    entry.anime.romaji_title,
    entry.anime.native_title,
  ].filter((t): t is string => Boolean(t));

  return titles.some((title) => title.toLowerCase().includes(needle));
}

export function filterLibraryEntries(
  entries: LibraryEntry[],
  options: LibraryFilterOptions | string = {},
): LibraryEntry[] {
  const opts =
    typeof options === "string" ? { query: options } : options;
  const needle = (opts.query ?? "").trim().toLowerCase();
  const genres = opts.genres ?? [];

  let result = entries;

  if (needle) {
    result = result.filter((entry) => matchesTitleQuery(entry, needle));
  }

  return filterByGenre(result, genres, (entry) => entry.anime.genres ?? []);
}
