"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EntryCard } from "@/components/library/entry-card";
import { GenreFilter } from "@/components/filters/genre-filter";
import { Input } from "@/components/ui/input";
import { filterLibraryEntries } from "@/lib/library/filter";
import type { LibraryEntry } from "@/lib/library/queries";
import { useGenreFromUrl, useSetGenreInUrl } from "@/lib/filters/use-genre-url";

type LibraryPanelProps = {
  entries: LibraryEntry[];
};

export function LibraryPanel({ entries }: LibraryPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const genresFromUrl = useGenreFromUrl();
  const setGenresInUrl = useSetGenreInUrl();
  const [query, setQuery] = useState(qFromUrl);

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === qFromUrl) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, qFromUrl, pathname, router, searchParams]);

  const filtered = useMemo(
    () =>
      filterLibraryEntries(entries, {
        query: qFromUrl,
        genres: genresFromUrl,
      }),
    [entries, qFromUrl, genresFromUrl],
  );

  const searching = qFromUrl.trim().length > 0;
  const genreFiltering = genresFromUrl.length > 0;
  const filtering = searching || genreFiltering;

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search your library…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search your library"
      />

      <GenreFilter selected={genresFromUrl} onChange={setGenresInUrl} />

      {filtering ? (
        <p className="text-sm text-muted">
          {filtered.length} of {entries.length}{" "}
          {entries.length === 1 ? "entry" : "entries"} match
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-display text-xl text-ink">No matches</p>
          <p className="mt-1 text-sm text-muted">
            {searching ? (
              <>
                Nothing in your library matches &ldquo;{qFromUrl}&rdquo;.
              </>
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
