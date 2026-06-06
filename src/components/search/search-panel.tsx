"use client";

import { useState, type ReactNode } from "react";

import { GenreFilter } from "@/components/filters/genre-filter";
import { ControlRail, WidePageFrame } from "@/components/layout/page-frame";
import { SearchResultCard } from "@/components/search/search-result-card";
import {
  ANILIST_FORMATS,
  ANILIST_FORMAT_LABELS,
  SEARCH_SORT_KEYS,
  SEARCH_SORT_LABELS,
  type AniListFormat,
  type SearchSortKey,
} from "@/lib/anilist/search-filters";
import { useGenreFilters } from "@/lib/filters";
import { useAnilistSearch } from "@/lib/search";

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint sm:left-5"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 3.39 9.84l3.39 3.38a.75.75 0 1 0 1.06-1.06l-3.38-3.39A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-faint">
        {label}
      </p>
      {children}
    </div>
  );
}

export function SearchPanel() {
  const { genres, setGenres, genreKey } = useGenreFilters();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<AniListFormat | null>(null);
  const [sort, setSort] = useState<SearchSortKey>("relevance");

  const { results, loading, error, isActive, trimmedQuery } = useAnilistSearch({
    query,
    genres,
    genreKey,
    format,
    sort,
  });

  const hasQuery = trimmedQuery.length > 0;
  const hasFilters = genres.length > 0 || format !== null;

  function resetFilters() {
    setGenres([]);
    setFormat(null);
    setSort("relevance");
  }

  return (
    <WidePageFrame className="space-y-6">
      <div>
        <p className="eyebrow">Discover</p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">Search</h1>
      </div>

      <ControlRail
        sidebarLabel="Search filters"
        sidebar={
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Filters</p>
              {hasFilters || sort !== "relevance" ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-muted transition-colors hover:text-accent"
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <FilterSection label="Sort by">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SearchSortKey)}
                aria-label="Sort results"
                className="w-full rounded-lg border border-line-strong bg-paper px-3 py-2.5 text-base text-ink sm:text-sm"
              >
                {SEARCH_SORT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {SEARCH_SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </FilterSection>

            <FilterSection label="Format">
              <div className="flex flex-wrap gap-1.5">
                {ANILIST_FORMATS.map((value) => {
                  const active = format === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFormat(active ? null : value)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors sm:py-1 ${
                        active
                          ? "border-accent bg-accent text-on-accent"
                          : "border-line-strong bg-surface text-muted hover:border-accent hover:text-accent"
                      }`}
                    >
                      {ANILIST_FORMAT_LABELS[value]}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection label="Genre">
              <GenreFilter
                selected={genres}
                onChange={setGenres}
                layout="wrap"
              />
            </FilterSection>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <div className="relative">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search by title…  e.g. Frieren, Cowboy Bebop"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search anime"
                className="w-full rounded-2xl border border-line-strong bg-surface py-3 pr-4 pl-12 text-base text-ink shadow-[0_8px_28px_-22px_rgb(var(--shadow-color)/0.5)] outline-none transition-colors placeholder:text-faint focus:border-accent sm:py-3.5 sm:pl-14"
              />
            </div>
            {loading ? (
              <p className="mt-2 text-sm text-muted">Searching…</p>
            ) : null}
          </div>

          {error ? (
            <p
              className="rounded-xl border border-line bg-accent-soft px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {!loading && isActive && results.length === 0 && !error ? (
            <p className="text-sm text-muted">
              {hasQuery
                ? `No results for “${trimmedQuery}”.`
                : "No results for the selected filters."}
            </p>
          ) : null}

          {!isActive && !loading ? (
            <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
              <p className="font-display text-xl text-ink">
                Start typing or pick filters
              </p>
              <p className="mt-1 text-sm text-muted">
                Search by title, browse by genre or format, or combine them.
              </p>
            </div>
          ) : null}

          {results.length > 0 ? (
            <ul className="grid gap-3 xl:grid-cols-2">
              {results.map((media) => (
                <SearchResultCard key={media.id} media={media} />
              ))}
            </ul>
          ) : null}
        </div>
      </ControlRail>
    </WidePageFrame>
  );
}
