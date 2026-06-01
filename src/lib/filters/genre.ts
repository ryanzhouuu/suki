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
