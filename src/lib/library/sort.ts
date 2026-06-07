import type { AnimeEntryStatus } from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";

export const LIBRARY_SORT_KEYS = [
  "updated",
  "date_added",
  "title",
  "priority",
  "release_year",
  "personal_score",
  "completed_at",
] as const;

export type LibrarySortKey = (typeof LIBRARY_SORT_KEYS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export function isSortDirection(
  value: string | undefined | null,
): value is SortDirection {
  return value === "asc" || value === "desc";
}

/**
 * Each sort key has a natural default direction: titles read A→Z, everything
 * else leads with the "most" (newest, highest score, highest priority).
 */
export function defaultDirectionForSort(sort: LibrarySortKey): SortDirection {
  return sort === "title" ? "asc" : "desc";
}

// Higher number = ranks first under the default (descending) direction.
const PRIORITY_RANK: Record<string, number> = {
  high: 2,
  medium: 1,
  low: 0,
};

export const LIBRARY_SORT_LABELS: Record<LibrarySortKey, string> = {
  updated: "Recently updated",
  date_added: "Date added",
  title: "Title",
  priority: "Priority",
  release_year: "Release year",
  personal_score: "Personal score",
  completed_at: "Completed date",
};

export function isLibrarySortKey(value: string | undefined): value is LibrarySortKey {
  return LIBRARY_SORT_KEYS.includes(value as LibrarySortKey);
}

export function defaultSortForStatus(
  status?: AnimeEntryStatus,
): LibrarySortKey {
  if (status === "plan_to_watch") return "priority";
  if (status === "completed") return "personal_score";
  return "updated";
}

function entryTitle(entry: LibraryEntry): string {
  return (
    entry.anime.english_title ||
    entry.anime.romaji_title ||
    entry.anime.native_title ||
    ""
  ).toLowerCase();
}

function comparePrimaryAscending(
  a: LibraryEntry,
  b: LibraryEntry,
  sort: LibrarySortKey,
): number {
  switch (sort) {
    case "title":
      return entryTitle(a).localeCompare(entryTitle(b));
    case "date_added":
      return a.created_at.localeCompare(b.created_at);
    case "priority": {
      const aPriority = a.priority ? PRIORITY_RANK[a.priority] ?? -1 : -1;
      const bPriority = b.priority ? PRIORITY_RANK[b.priority] ?? -1 : -1;
      return aPriority - bPriority;
    }
    case "release_year": {
      const aYear = a.anime.season_year ?? -1;
      const bYear = b.anime.season_year ?? -1;
      return aYear - bYear;
    }
    case "personal_score": {
      const aScore = a.personal_score ?? -1;
      const bScore = b.personal_score ?? -1;
      return Number(aScore) - Number(bScore);
    }
    case "completed_at": {
      const aCompleted = a.completed_at ?? "";
      const bCompleted = b.completed_at ?? "";
      return aCompleted.localeCompare(bCompleted);
    }
    case "updated":
    default:
      return a.updated_at.localeCompare(b.updated_at);
  }
}

function compareTiebreakerAscending(
  a: LibraryEntry,
  b: LibraryEntry,
  sort: LibrarySortKey,
): number {
  switch (sort) {
    case "priority":
      return a.created_at.localeCompare(b.created_at);
    case "release_year":
      return entryTitle(a).localeCompare(entryTitle(b));
    case "personal_score": {
      const aCompleted = a.completed_at ?? "";
      const bCompleted = b.completed_at ?? "";
      return aCompleted.localeCompare(bCompleted);
    }
    default:
      return 0;
  }
}

export function sortLibraryEntries(
  entries: LibraryEntry[],
  sort: LibrarySortKey,
  direction: SortDirection = defaultDirectionForSort(sort),
): LibraryEntry[] {
  const factor = direction === "asc" ? 1 : -1;
  const sorted = [...entries];
  sorted.sort((a, b) => {
    const primary = comparePrimaryAscending(a, b, sort);
    if (primary !== 0) return factor * primary;
    return compareTiebreakerAscending(a, b, sort);
  });
  return sorted;
}

export function sortOptionsForStatus(
  status?: AnimeEntryStatus,
): LibrarySortKey[] {
  if (status === "plan_to_watch") {
    return ["priority", "date_added", "release_year", "title", "updated"];
  }
  if (status === "completed") {
    return [
      "personal_score",
      "completed_at",
      "title",
      "release_year",
      "date_added",
      "updated",
    ];
  }
  return ["updated", "date_added", "title", "release_year"];
}
