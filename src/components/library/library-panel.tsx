"use client";

import { useMemo } from "react";

import { EntryCard } from "@/components/library/entry-card";
import { FilterMatchCount } from "@/components/filters/filter-match-count";
import { GenreFilter } from "@/components/filters/genre-filter";
import { Input } from "@/components/ui/input";
import { useGenreFilters } from "@/lib/filters";
import { filterLibraryEntries } from "@/lib/library/filter";
import type { LibraryEntry } from "@/lib/library/queries";
import { useDebouncedUrlParam } from "@/lib/navigation/url-params";

type LibraryPanelProps = {
  entries: LibraryEntry[];
};

export function LibraryPanel({ entries }: LibraryPanelProps) {
  const { value: query, setValue: setQuery, urlValue: qFromUrl } =
    useDebouncedUrlParam("q");
  const { genres, setGenres, isFiltering: genreFiltering } = useGenreFilters();

  const filtered = useMemo(
    () => filterLibraryEntries(entries, { query: qFromUrl, genres }),
    [entries, qFromUrl, genres],
  );

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

      <GenreFilter selected={genres} onChange={setGenres} />

      {filtering ? (
        <FilterMatchCount matched={filtered.length} total={entries.length} noun="entry" />
      ) : null}

      {filtered.length === 0 ? (
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
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
