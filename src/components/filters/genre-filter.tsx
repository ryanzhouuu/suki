"use client";

import { useState } from "react";

import { ANILIST_GENRES } from "@/lib/anilist/genres";

type GenreFilterProps = {
  selected: string[];
  onChange: (genres: string[]) => void;
  /**
   * `grid` (default) lays chips out in fixed columns for full-width contexts.
   * `wrap` flows chips to fit narrow containers like a sidebar rail.
   */
  layout?: "grid" | "wrap";
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
        open ? "rotate-90" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function GenreFilter({
  selected,
  onChange,
  layout = "grid",
}: GenreFilterProps) {
  const selectedSet = new Set(selected);
  const [open, setOpen] = useState(() => selected.length > 0);

  function toggle(genre: string) {
    if (selectedSet.has(genre)) {
      onChange(selected.filter((g) => g !== genre));
    } else {
      onChange([...selected, genre]);
    }
  }

  const summary =
    selected.length > 0 ? selected.join(", ") : "Tap to filter by genre";

  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="genre-filter-panel"
          id="genre-filter-trigger"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronIcon open={open} />
          <span className="min-w-0 space-y-0.5">
            <span className="block text-xs font-medium uppercase tracking-wide text-faint">
              Genres
              {selected.length > 0 ? (
                <span className="ml-1.5 normal-case tracking-normal text-muted">
                  · {selected.length} selected
                </span>
              ) : null}
            </span>
            {!open ? (
              <span className="block truncate text-sm text-muted">{summary}</span>
            ) : null}
          </span>
        </button>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div
        id="genre-filter-panel"
        role="region"
        aria-labelledby="genre-filter-trigger"
        hidden={!open}
        className={open ? "border-t border-line px-3 pb-3 pt-3" : "hidden"}
      >
        <div
          className={
            layout === "wrap"
              ? "flex flex-wrap gap-1.5"
              : "grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4"
          }
          role="group"
          aria-label="Filter by genre"
        >
          {ANILIST_GENRES.map((genre) => {
            const active = selectedSet.has(genre);
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(genre)}
                className={`rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-2.5 sm:py-1.5 sm:text-sm ${
                  layout === "wrap" ? "text-left" : "text-center"
                } ${
                  active
                    ? "bg-accent text-on-accent shadow-sm"
                    : "border border-line-strong bg-paper text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
