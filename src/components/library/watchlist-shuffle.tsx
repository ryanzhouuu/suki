"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";

import { updateAnimeEntry } from "@/actions/library";
import { logWatchlistShuffle } from "@/actions/shuffle";
import { AnimePoster } from "@/components/anime/anime-poster";
import { GenreFilter } from "@/components/filters/genre-filter";
import { Button } from "@/components/ui/button";
import type { LibraryEntry } from "@/lib/library/queries";
import {
  EMPTY_SHUFFLE_FILTERS,
  filterShuffleCandidates,
  pickFromCandidates,
} from "@/lib/library/shuffle";
import {
  LENGTH_BUCKETS,
  type LengthBucket,
} from "@/lib/recommendations/request-prefs";

const LENGTH_LABELS: Record<LengthBucket, string> = {
  movie: "Movie",
  short: "Short",
  cour: "Standard",
  long: "Long",
};

function entryTitle(entry: LibraryEntry): string {
  const anime = entry.anime;
  return (
    anime.english_title ||
    anime.romaji_title ||
    anime.native_title ||
    "Untitled"
  );
}

type WatchlistShuffleProps = {
  /** The viewer's plan-to-watch entries. */
  entries: LibraryEntry[];
  /** Compact, filterless variant for the Home widget. */
  compact?: boolean;
};

export function WatchlistShuffle({
  entries,
  compact = false,
}: WatchlistShuffleProps) {
  const [lengthBucket, setLengthBucket] = useState<LengthBucket | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [pick, setPick] = useState<LibraryEntry | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [started, setStarted] = useState<{ title: string; anilistId: number } | null>(
    null,
  );
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isStarting, startTransition] = useTransition();

  // Per-mount entropy generated outside render (effects may call impure fns),
  // combined with a spin counter so each spin gets a fresh, reproducible seed.
  const sessionSeedRef = useRef<string>("shuffle");
  const spinCountRef = useRef(0);
  useEffect(() => {
    sessionSeedRef.current = `${Date.now()}-${Math.random()}`;
  }, []);

  const filters = compact ? EMPTY_SHUFFLE_FILTERS : { lengthBucket, genres };

  function spin() {
    setError(null);
    setStarted(null);
    const candidates = filterShuffleCandidates(entries, filters).filter(
      (entry) => !excludedIds.has(entry.id),
    );

    if (candidates.length === 0) {
      setPick(null);
      setNoMatch(true);
      return;
    }

    // Avoid handing back the same title two spins in a row when there's a choice.
    const pool =
      pick && candidates.length > 1
        ? candidates.filter((entry) => entry.id !== pick.id)
        : candidates;

    spinCountRef.current += 1;
    const chosen = pickFromCandidates(
      pool,
      `${sessionSeedRef.current}-${spinCountRef.current}`,
    );
    setNoMatch(false);
    setPick(chosen);

    if (chosen) {
      void logWatchlistShuffle({
        anilistId: chosen.anime.anilist_id,
        lengthBucket: filters.lengthBucket,
        genres: filters.genres,
      });
    }
  }

  function startWatching() {
    if (!pick) return;
    const current = pick;
    startTransition(async () => {
      const result = await updateAnimeEntry(current.id, { status: "watching" });
      if (result.error) {
        setError(result.error);
        return;
      }
      setExcludedIds((prev) => new Set(prev).add(current.id));
      setStarted({
        title: entryTitle(current),
        anilistId: current.anime.anilist_id,
      });
      setPick(null);
    });
  }

  const remaining = entries.filter((entry) => !excludedIds.has(entry.id));
  const fitLine =
    [
      filters.lengthBucket ? LENGTH_LABELS[filters.lengthBucket] : null,
      filters.genres.length > 0 ? filters.genres.slice(0, 3).join(" · ") : null,
    ]
      .filter(Boolean)
      .join(" · ") || "A wildcard from your watchlist";

  return (
    <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Can&apos;t decide?</p>
          <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
            What should I watch?
          </h2>
        </div>
        <Button
          variant="primary"
          size={compact ? "sm" : "md"}
          onClick={spin}
          disabled={remaining.length === 0}
        >
          {pick || started ? "Spin again" : "Shuffle"}
        </Button>
      </div>

      {!compact ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(["any", ...LENGTH_BUCKETS] as const).map((value) => {
              const selected =
                value === "any" ? lengthBucket === null : lengthBucket === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setLengthBucket(value === "any" ? null : value)
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line-strong bg-surface text-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  {value === "any" ? "Any length" : LENGTH_LABELS[value]}
                </button>
              );
            })}
          </div>
          <GenreFilter selected={genres} onChange={setGenres} layout="wrap" />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-card border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {started ? (
        <div className="mt-4 rounded-card border border-accent/35 bg-accent-soft/50 p-4">
          <p className="text-sm text-ink">
            Now watching{" "}
            <Link
              href={`/anime/${started.anilistId}`}
              className="font-semibold text-accent hover:underline"
            >
              {started.title}
            </Link>
            . Enjoy!
          </p>
        </div>
      ) : null}

      {noMatch ? (
        <p className="mt-4 rounded-card border border-dashed border-line-strong p-4 text-sm text-muted">
          Nothing in your watchlist matches those filters — try a different
          length or genre.
        </p>
      ) : null}

      {pick ? (
        <div className="mt-4 flex flex-col gap-4 rounded-card border border-line-strong bg-paper/50 p-4 sm:flex-row">
          <Link href={`/anime/${pick.anime.anilist_id}`} className="shrink-0">
            <AnimePoster
              src={pick.anime.cover_image_url}
              alt={entryTitle(pick)}
              size={compact ? "md" : "lg"}
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="font-display text-lg font-semibold leading-snug text-ink">
              {entryTitle(pick)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">
              {[
                pick.anime.format,
                pick.anime.episodes ? `${pick.anime.episodes} eps` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-2 text-sm text-muted">{fitLine}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={startWatching}
                disabled={isStarting}
              >
                {isStarting ? "Starting…" : "Start watching"}
              </Button>
              <Button variant="secondary" size="sm" onClick={spin}>
                Spin again
              </Button>
              <Link href={`/anime/${pick.anime.anilist_id}`}>
                <Button variant="ghost" size="sm">
                  Open details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
