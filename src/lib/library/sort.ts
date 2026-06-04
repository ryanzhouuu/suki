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

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
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

export function sortLibraryEntries(
  entries: LibraryEntry[],
  sort: LibrarySortKey,
): LibraryEntry[] {
  const sorted = [...entries];

  sorted.sort((a, b) => {
    switch (sort) {
      case "title":
        return entryTitle(a).localeCompare(entryTitle(b));
      case "date_added":
        return b.created_at.localeCompare(a.created_at);
      case "priority": {
        const aPriority = a.priority ? PRIORITY_ORDER[a.priority] ?? 3 : 3;
        const bPriority = b.priority ? PRIORITY_ORDER[b.priority] ?? 3 : 3;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return b.created_at.localeCompare(a.created_at);
      }
      case "release_year": {
        const aYear = a.anime.season_year ?? -1;
        const bYear = b.anime.season_year ?? -1;
        if (aYear !== bYear) return bYear - aYear;
        return entryTitle(a).localeCompare(entryTitle(b));
      }
      case "personal_score": {
        const aScore = a.personal_score ?? -1;
        const bScore = b.personal_score ?? -1;
        if (aScore !== bScore) return Number(bScore) - Number(aScore);
        const aCompleted = a.completed_at ?? "";
        const bCompleted = b.completed_at ?? "";
        return bCompleted.localeCompare(aCompleted);
      }
      case "completed_at": {
        const aCompleted = a.completed_at ?? "";
        const bCompleted = b.completed_at ?? "";
        if (!aCompleted && !bCompleted) return 0;
        if (!aCompleted) return 1;
        if (!bCompleted) return -1;
        return bCompleted.localeCompare(aCompleted);
      }
      case "updated":
      default:
        return b.updated_at.localeCompare(a.updated_at);
    }
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
