"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EntryCard } from "@/components/library/entry-card";
import { EntryEditPanel } from "@/components/library/entry-edit-panel";
import { FilterMatchCount } from "@/components/filters/filter-match-count";
import { GenreFilter } from "@/components/filters/genre-filter";
import { LibrarySortSelect } from "@/components/library/library-sort-select";
import { Input } from "@/components/ui/input";
import { useGenreFilters } from "@/lib/filters";
import { filterLibraryEntries } from "@/lib/library/filter";
import type { LibraryEntry } from "@/lib/library/queries";
import {
  defaultSortForStatus,
  isLibrarySortKey,
  sortLibraryEntries,
  type LibrarySortKey,
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

  const { value: query, setValue: setQuery, urlValue: qFromUrl } =
    useDebouncedUrlParam("q");
  const { genres, setGenres, isFiltering: genreFiltering } = useGenreFilters();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterLibraryEntries(entries, { query: qFromUrl, genres }),
    [entries, qFromUrl, genres],
  );

  const sorted = useMemo(
    () => sortLibraryEntries(filtered, sort),
    [filtered, sort],
  );

  const editingEntry = sorted.find((entry) => entry.id === editingEntryId) ?? null;

  const titleFiltering = qFromUrl.trim().length > 0;
  const filtering = titleFiltering || genreFiltering;

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search your library…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search your library"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <GenreFilter selected={genres} onChange={setGenres} />
        <LibrarySortSelect status={status} />
      </div>

      {filtering ? (
        <FilterMatchCount matched={sorted.length} total={entries.length} noun="entry" />
      ) : null}

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
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
  );
}
