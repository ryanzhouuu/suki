"use client";

import { useState } from "react";

import { GenreFilter } from "@/components/filters/genre-filter";
import { SearchResultCard } from "@/components/search/search-result-card";
import { Input } from "@/components/ui/input";
import { useGenreFilters } from "@/lib/filters";
import { useAnilistSearch } from "@/lib/search";

export function SearchPanel() {
  const { genres, setGenres, genreKey } = useGenreFilters();
  const [query, setQuery] = useState("");

  const { results, loading, error, isActive, trimmedQuery } = useAnilistSearch({
    query,
    genres,
    genreKey,
  });

  const hasQuery = trimmedQuery.length > 0;
  const hasGenres = genres.length > 0;

  return (
    <div className="space-y-7">
      <div>
        <p className="eyebrow">Discover</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Search</h1>
        <p className="mt-2 text-muted">
          Find anime via AniList and add them to your library in seconds.
        </p>
      </div>

      <div className="sticky top-18 z-10 -mx-1 space-y-3 bg-paper/80 px-1 py-1 backdrop-blur-md">
        <Input
          type="search"
          placeholder="Search by title…  e.g. Frieren, Cowboy Bebop"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <GenreFilter selected={genres} onChange={setGenres} />
      </div>

      {loading ? <p className="text-sm text-muted">Searching…</p> : null}
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
          <p className="font-display text-xl text-ink">Start typing or pick genres</p>
          <p className="mt-1 text-sm text-muted">
            Search by title, browse by genre, or combine both.
          </p>
        </div>
      ) : null}

      <ul className="space-y-3">
        {results.map((media) => (
          <SearchResultCard key={media.id} media={media} />
        ))}
      </ul>
    </div>
  );
}
