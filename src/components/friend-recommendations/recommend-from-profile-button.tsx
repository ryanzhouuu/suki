"use client";

import { useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import { RecommendComposer } from "@/components/friend-recommendations/recommend-composer";
import { RecommendDialog } from "@/components/friend-recommendations/recommend-dialog";
import { Button } from "@/components/ui/button";
import type { AniListMediaSummary } from "@/lib/anilist/types";
import { useAnilistSearch } from "@/lib/search";

type RecommendFromProfileButtonProps = {
  recipientUserId: string;
  recipientUsername: string;
  recipientName: string;
};

function mediaTitle(media: AniListMediaSummary): string {
  return media.title.english || media.title.romaji || "Untitled";
}

export function RecommendFromProfileButton({
  recipientUserId,
  recipientUsername,
  recipientName,
}: RecommendFromProfileButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AniListMediaSummary | null>(null);

  // Reuses the shared /api/search-backed hook: debounced, rate-limited, cached.
  const { results, loading, isActive, trimmedQuery } = useAnilistSearch({
    query,
    genres: [],
    genreKey: "",
  });

  function close() {
    setOpen(false);
    setQuery("");
    setSelected(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className="h-4 w-4"
        >
          <path d="M13 4.5a2.5 2.5 0 1 1 .7 1.74l-4.3 2.15a2.5 2.5 0 0 1 0 1.22l4.3 2.15a2.5 2.5 0 1 1-.67 1.34l-4.3-2.15a2.5 2.5 0 1 1 0-3.9l4.3-2.15A2.5 2.5 0 0 1 13 4.5Z" />
        </svg>
        Recommend an anime
      </Button>

      <RecommendDialog
        open={open}
        onClose={close}
        title="Recommend an anime"
        subtitle={`To ${recipientName}`}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
              <AnimePoster
                src={selected.coverImage?.large ?? null}
                alt={mediaTitle(selected)}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-ink">
                  {mediaTitle(selected)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {[selected.format, selected.seasonYear]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <RecommendComposer
              recipientUserId={recipientUserId}
              anilistId={selected.id}
              animeTitle={mediaTitle(selected)}
              recipientName={recipientName}
              onReset={() => setSelected(null)}
              resetLabel="Pick another title"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a title to send…"
              aria-label={`Search an anime to recommend to ${recipientUsername}`}
              className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
            />

            {loading ? (
              <p className="text-sm text-muted">Searching…</p>
            ) : null}

            {!loading && isActive && results.length === 0 ? (
              <p className="text-sm text-muted">
                No results for “{trimmedQuery}”.
              </p>
            ) : null}

            {!isActive ? (
              <p className="text-sm text-muted">
                Type a title to find something worth sharing.
              </p>
            ) : null}

            {results.length > 0 ? (
              <ul className="space-y-1.5">
                {results.map((media) => (
                  <li key={media.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(media)}
                      className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2 text-left transition-colors hover:border-accent hover:bg-surface-2"
                    >
                      <AnimePoster
                        src={media.coverImage?.large ?? null}
                        alt={mediaTitle(media)}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-ink">
                          {mediaTitle(media)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {[media.format, media.seasonYear]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </RecommendDialog>
    </>
  );
}
