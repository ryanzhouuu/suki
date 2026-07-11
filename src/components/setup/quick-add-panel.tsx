"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getLibraryStatusMap } from "@/actions/library";
import { QuickAddResult } from "@/components/setup/quick-add-result";
import type { AnimeEntryStatus } from "@/lib/constants";
import { useAnilistSearch } from "@/lib/search";

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-faint"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 3.39 9.84l3.39 3.38a.75.75 0 1 0 1.06-1.06l-3.38-3.39A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function QuickAddPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [libraryStatusMap, setLibraryStatusMap] = useState<
    Record<number, AnimeEntryStatus>
  >({});

  useEffect(() => {
    getLibraryStatusMap().then(setLibraryStatusMap).catch(() => {});
  }, []);

  const { results, loading, error, isActive, trimmedQuery } = useAnilistSearch({
    query,
    genres: [],
    genreKey: "",
  });

  function handleAdded(anilistId: number, status: AnimeEntryStatus) {
    setLibraryStatusMap((prev) => ({ ...prev, [anilistId]: status }));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Search for anime and pick a status to add them to your library.
      </p>

      <div className="relative">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search anime to add"
          className="w-full rounded-xl border border-line-strong bg-surface py-3 pr-4 pl-12 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-accent sm:text-sm"
        />
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
        <p className="text-sm text-muted">No results for “{trimmedQuery}”.</p>
      ) : null}

      {!isActive && !loading ? (
        <div className="rounded-xl border border-dashed border-line-strong p-8 text-center">
          <p className="text-sm text-muted">Start typing to search AniList.</p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((media) => (
            <QuickAddResult
              key={media.id}
              media={media}
              initialStatus={libraryStatusMap[media.id]}
              onAdded={handleAdded}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
