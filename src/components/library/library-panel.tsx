"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EntryCard } from "@/components/library/entry-card";
import { EntryEditPanel } from "@/components/library/entry-edit-panel";
import { FilterMatchCount } from "@/components/filters/filter-match-count";
import { GenreFilter } from "@/components/filters/genre-filter";
import { LibrarySortSelect } from "@/components/library/library-sort-select";
import { ControlRail } from "@/components/layout/page-frame";
import { Input } from "@/components/ui/input";
import { useGenreFilters } from "@/lib/filters";
import { filterLibraryEntries } from "@/lib/library/filter";
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
};

export function LibraryPanel({ entries, status }: LibraryPanelProps) {
  const searchParams = useSearchParams();
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

  const editingEntry = sorted.find((entry) => entry.id === editingEntryId) ?? null;

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
          {filtering ? (
            <FilterMatchCount
              matched={sorted.length}
              total={entries.length}
              noun="entry"
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

        {sorted.length === 0 ? (
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
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
