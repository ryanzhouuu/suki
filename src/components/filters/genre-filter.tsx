"use client";

import { ANILIST_GENRES } from "@/lib/anilist/genres";

type GenreFilterProps = {
  selected: string[];
  onChange: (genres: string[]) => void;
};

export function GenreFilter({ selected, onChange }: GenreFilterProps) {
  const selectedSet = new Set(selected);

  function toggle(genre: string) {
    if (selectedSet.has(genre)) {
      onChange(selected.filter((g) => g !== genre));
    } else {
      onChange([...selected, genre]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          Genres
        </p>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-accent hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
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
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-on-accent shadow-sm"
                  : "border border-line-strong bg-surface text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
