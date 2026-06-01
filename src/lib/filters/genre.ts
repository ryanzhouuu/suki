/**
 * Client-side genre filter: match if the item has ANY of the selected genres.
 * (AniList Search uses a separate OR-merge strategy; see searchAniListAnime.)
 */
export function matchesAnyGenre(
  itemGenres: string[],
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  if (itemGenres.length === 0) return false;
  return selected.some((g) => itemGenres.includes(g));
}

/** Stable string key for genre selections (use in effect dependency arrays). */
export function genreFilterKey(genres: string[]): string {
  return genres.join("\0");
}

export function filterByGenre<T>(
  items: T[],
  selected: string[],
  getGenres: (item: T) => string[],
): T[] {
  if (selected.length === 0) return items;
  return items.filter((item) => matchesAnyGenre(getGenres(item), selected));
}
