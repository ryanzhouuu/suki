"use client";

import { useState } from "react";

import { GenreFilter } from "@/components/filters/genre-filter";
import { ControlRail, WidePageFrame } from "@/components/layout/page-frame";
import { SearchResultCard } from "@/components/search/search-result-card";
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

export function SearchPanel() {
  const { genres, setGenres, genreKey } = useGenreFilters();
  const [query, setQuery] = useState("");

  const { results, loading, error, isActive, trimmedQuery } = useAnilistSearch({
    query,
    genres,
    genreKey,
  });

  const hasQuery = trimmedQuery.length > 0;

  return (
    <WidePageFrame className="space-y-6">
      <div>
        <p className="eyebrow">Discover</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Search</h1>
        <p className="mt-2 max-w-xl text-muted">
          Find anime via AniList and add them to your library in seconds.
        </p>
      </div>

      <ControlRail
        sidebarLabel="Search filters"
        sidebar={
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">
              Filter by genre
            </p>
            <GenreFilter selected={genres} onChange={setGenres} layout="wrap" />
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
                autoFocus
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
                : "No results for the selected genres."}
            </p>
          ) : null}

          {!isActive && !loading ? (
            <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
              <p className="font-display text-xl text-ink">
                Start typing or pick genres
              </p>
              <p className="mt-1 text-sm text-muted">
                Search by title, browse by genre, or combine both.
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
