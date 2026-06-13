import { matchesAnyGenre } from "@/lib/filters/genre";
import type { LibraryEntry } from "@/lib/library/queries";
import { matchesLengthBucket } from "@/lib/recommendations/request-filter";
import type { LengthBucket } from "@/lib/recommendations/request-prefs";
import { createSeededRandom } from "@/lib/recommendations/seeded-random";

export type ShuffleFilters = {
  /** Time budget; null = any length. */
  lengthBucket: LengthBucket | null;
  /** Match any of these genres; empty = any genre. */
  genres: string[];
};

export const EMPTY_SHUFFLE_FILTERS: ShuffleFilters = {
  lengthBucket: null,
  genres: [],
};

/** Plan-to-watch entries that satisfy the optional length + genre filters. */
export function filterShuffleCandidates(
  entries: LibraryEntry[],
  filters: ShuffleFilters,
): LibraryEntry[] {
  return entries.filter((entry) => {
    const anime = entry.anime;
    if (filters.lengthBucket && !matchesLengthBucket(anime, filters.lengthBucket)) {
      return false;
    }
    if (
      filters.genres.length > 0 &&
      !matchesAnyGenre(anime.genres ?? [], filters.genres)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Deterministic uniform pick from a list. Same seed → same result, so a spin
 * is reproducible/testable; null when the list is empty.
 */
export function pickFromCandidates<T>(items: T[], seed: string): T | null {
  if (items.length === 0) return null;
  const rand = createSeededRandom(seed);
  return items[Math.floor(rand() * items.length)] ?? null;
}
