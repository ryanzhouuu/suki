"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EntryCard } from "@/components/library/entry-card";
import { EntryEditPanel } from "@/components/library/entry-edit-panel";
import { GroupToggle } from "@/components/library/group-toggle";
import { SeriesGroupCard } from "@/components/library/series-group-card";
import { FilterMatchCount } from "@/components/filters/filter-match-count";
import { GenreFilter } from "@/components/filters/genre-filter";
import { LibrarySortSelect } from "@/components/library/library-sort-select";
import { ControlRail } from "@/components/layout/page-frame";
import { Input } from "@/components/ui/input";
import { useGenreFilters } from "@/lib/filters";
import { filterLibraryEntries } from "@/lib/library/filter";
import {
  filterGroups,
  filterGroupsByStatus,
  groupLibraryEntries,
  sortLibraryGroups,
  type SeriesRef,
} from "@/lib/library/group";
import type { LibraryEntry } from "@/lib/library/queries";
import {
  defaultDirectionForSort,
  defaultSortForStatus,
  isLibrarySortKey,
  isSortDirection,
  sortLibraryEntries,
  type LibrarySortKey,
  type SortDirection,
} from "@/lib/library/sort";
import type { AnimeEntryStatus } from "@/lib/constants";
import { useDebouncedUrlParam } from "@/lib/navigation/url-params";

type LibraryPanelProps = {
  entries: LibraryEntry[];
  status?: AnimeEntryStatus;
  /** anime_id → series, for the "group by show" view. */
  seriesByAnimeId?: Record<string, SeriesRef>;
};

export function LibraryPanel({
  entries,
  status,
  seriesByAnimeId = {},
}: LibraryPanelProps) {
  const searchParams = useSearchParams();
  const grouped = searchParams.get("group") === "series";
  const sortParam = searchParams.get("sort");
  const sort: LibrarySortKey =
    sortParam && isLibrarySortKey(sortParam)
      ? sortParam
      : defaultSortForStatus(status);
  const dirParam = searchParams.get("dir");
  const direction: SortDirection = isSortDirection(dirParam)
    ? dirParam
    : defaultDirectionForSort(sort);

  const { value: query, setValue: setQuery, urlValue: qFromUrl } =
    useDebouncedUrlParam("q");
  const { genres, setGenres, isFiltering: genreFiltering } = useGenreFilters();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterLibraryEntries(entries, { query: qFromUrl, genres }),
    [entries, qFromUrl, genres],
  );

  const sorted = useMemo(
    () => sortLibraryEntries(filtered, sort, direction),
    [filtered, sort, direction],
  );

  const groups = useMemo(() => {
    if (!grouped) return [];
    const seriesMap = new Map(Object.entries(seriesByAnimeId));
    const built = groupLibraryEntries(entries, seriesMap);
    const byStatus = filterGroupsByStatus(built, status);
    const byFilter = filterGroups(byStatus, { query: qFromUrl, genres });
    return sortLibraryGroups(byFilter, sort, direction);
  }, [grouped, entries, seriesByAnimeId, status, qFromUrl, genres, sort, direction]);

  const editingEntry = entries.find((entry) => entry.id === editingEntryId) ?? null;
  const matchCount = grouped ? groups.length : sorted.length;
  const isEmpty = grouped ? groups.length === 0 : sorted.length === 0;

  const titleFiltering = qFromUrl.trim().length > 0;
  const filtering = titleFiltering || genreFiltering;

  return (
    <ControlRail
      sidebarLabel="Library filters"
      sidebar={
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            Filter &amp; sort
          </p>
          <Input
            type="search"
            placeholder="Search your library…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search your library"
          />
          <GenreFilter selected={genres} onChange={setGenres} layout="wrap" />
          <LibrarySortSelect status={status} />
          <GroupToggle />
          {filtering ? (
            <FilterMatchCount
              matched={matchCount}
              total={entries.length}
              noun={grouped ? "show" : "entry"}
            />
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {editingEntry ? (
          <EntryEditPanel
            key={editingEntry.id}
            entry={editingEntry}
            onClose={() => setEditingEntryId(null)}
          />
        ) : null}

        {isEmpty ? (
          <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
            <p className="font-display text-xl text-ink">No matches</p>
            <p className="mt-1 text-sm text-muted">
              {titleFiltering ? (
                <>Nothing in your library matches &ldquo;{qFromUrl}&rdquo;.</>
              ) : (
                <>Nothing in your library matches the selected genres.</>
              )}{" "}
              Try a different filter.
            </p>
          </div>
        ) : grouped ? (
          <ul className="grid grid-cols-1 gap-2.5">
            {groups.map((group) => (
              <SeriesGroupCard
                key={group.key}
                group={group}
                editingEntryId={editingEntryId}
                onEdit={setEditingEntryId}
              />
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {sorted.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => setEditingEntryId(entry.id)}
                isEditing={editingEntryId === entry.id}
              />
            ))}
          </ul>
        )}
      </div>
    </ControlRail>
  );
}
