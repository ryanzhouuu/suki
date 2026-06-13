import { ANIME_ENTRY_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { AnimeEntryStatus } from "@/lib/constants";
import { filterLibraryEntries, type LibraryFilterOptions } from "@/lib/library/filter";
import type { LibraryEntry } from "@/lib/library/queries";
import {
  sortLibraryEntries,
  type LibrarySortKey,
  type SortDirection,
  defaultDirectionForSort,
} from "@/lib/library/sort";
import type { Tables } from "@/types/database";

export type SeriesRef = Pick<
  Tables<"series">,
  "id" | "canonical_title" | "cover_image_url" | "slug"
>;

export type LibraryGroup = {
  /** Series id for grouped entries, or `anime:<entryId>` for standalone. */
  key: string;
  /** null when the entry has no series mapping (standalone fallback). */
  series: SeriesRef | null;
  entries: LibraryEntry[];
  primaryStatus: AnimeEntryStatus;
  statusCounts: Record<AnimeEntryStatus, number>;
};

/**
 * Order used to pick a single representative status for a mixed-status group:
 * an actively-watched franchise reads as "watching"; otherwise the most
 * meaningful settled status wins.
 */
export const STATUS_PRIORITY: AnimeEntryStatus[] = [
  "watching",
  "completed",
  "paused",
  "plan_to_watch",
  "dropped",
];

export function primaryStatusFor(entries: LibraryEntry[]): AnimeEntryStatus {
  const present = new Set(entries.map((e) => e.status));
  for (const status of STATUS_PRIORITY) {
    if (present.has(status)) return status;
  }
  // Entries always carry a valid status; fall back to the first listed.
  return STATUS_PRIORITY[0];
}

function emptyStatusCounts(): Record<AnimeEntryStatus, number> {
  return ANIME_ENTRY_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<AnimeEntryStatus, number>,
  );
}

/**
 * Group library entries by their mapped series. Entries sharing a `series_id`
 * collapse into one group; entries with no mapping become standalone
 * single-entry groups. Group order follows the first-seen entry, so the
 * incoming sort order (e.g. `updated_at desc`) carries through until callers
 * apply an explicit group sort.
 */
export function groupLibraryEntries(
  entries: LibraryEntry[],
  seriesByAnimeId: Map<string, SeriesRef>,
): LibraryGroup[] {
  const groups: LibraryGroup[] = [];
  const bySeries = new Map<string, LibraryGroup>();

  for (const entry of entries) {
    const series = seriesByAnimeId.get(entry.anime_id) ?? null;

    if (series) {
      const existing = bySeries.get(series.id);
      if (existing) {
        existing.entries.push(entry);
        continue;
      }
      const group: LibraryGroup = {
        key: series.id,
        series,
        entries: [entry],
        primaryStatus: entry.status,
        statusCounts: emptyStatusCounts(),
      };
      bySeries.set(series.id, group);
      groups.push(group);
    } else {
      groups.push({
        key: `anime:${entry.id}`,
        series: null,
        entries: [entry],
        primaryStatus: entry.status,
        statusCounts: emptyStatusCounts(),
      });
    }
  }

  // Finalize aggregates once each group has all its entries.
  for (const group of groups) {
    group.primaryStatus = primaryStatusFor(group.entries);
    for (const entry of group.entries) {
      group.statusCounts[entry.status] += 1;
    }
  }

  return groups;
}

/** "1 watching, 2 completed" — non-zero counts in priority order. */
export function statusSummary(group: LibraryGroup): string {
  return STATUS_PRIORITY.filter((status) => group.statusCounts[status] > 0)
    .map((status) => `${group.statusCounts[status]} ${STATUS_LABELS[status].toLowerCase()}`)
    .join(", ");
}

/** Keep a group if at least one of its entries matches the status. */
export function filterGroupsByStatus(
  groups: LibraryGroup[],
  status?: AnimeEntryStatus,
): LibraryGroup[] {
  if (!status) return groups;
  return groups.filter((group) => group.statusCounts[status] > 0);
}

/** Keep a group if at least one of its entries matches the title/genre filter. */
export function filterGroups(
  groups: LibraryGroup[],
  options: LibraryFilterOptions | string = {},
): LibraryGroup[] {
  return groups.filter(
    (group) => filterLibraryEntries(group.entries, options).length > 0,
  );
}

/**
 * Sort groups using the "best representative per key" rule: each group's
 * value for the active sort key is its top entry under that key (max score,
 * most-recent date, etc.), then groups are ordered by those representatives
 * using the existing entry comparator.
 */
export function sortLibraryGroups(
  groups: LibraryGroup[],
  sort: LibrarySortKey,
  direction: SortDirection = defaultDirectionForSort(sort),
): LibraryGroup[] {
  const repToGroup = new Map<LibraryEntry, LibraryGroup>();
  const reps: LibraryEntry[] = [];

  for (const group of groups) {
    const rep = sortLibraryEntries(group.entries, sort, direction)[0];
    repToGroup.set(rep, group);
    reps.push(rep);
  }

  return sortLibraryEntries(reps, sort, direction).map(
    (rep) => repToGroup.get(rep) as LibraryGroup,
  );
}
