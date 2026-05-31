import type { LibraryEntry } from "@/lib/library/queries";

export function filterLibraryEntries(
  entries: LibraryEntry[],
  query: string,
): LibraryEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;

  return entries.filter((entry) => {
    const { anime } = entry;
    const titles = [
      anime.english_title,
      anime.romaji_title,
      anime.native_title,
    ].filter((t): t is string => Boolean(t));

    return titles.some((title) => title.toLowerCase().includes(needle));
  });
}
