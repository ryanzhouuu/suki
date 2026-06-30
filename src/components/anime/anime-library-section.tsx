"use client";

import Link from "next/link";
import { useState } from "react";

import { EntryEditPanel } from "@/components/library/entry-edit-panel";
import { StatusPicker } from "@/components/anime/status-picker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  STATUS_LABELS,
  WATCHLIST_PRIORITY_LABELS,
  type AnimeEntryStatus,
} from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";
import type { Tables } from "@/types/database";

type AnimeLibrarySectionProps = {
  anilistId: number;
  entry: Tables<"user_anime_entries"> | null;
  anime: Tables<"anime">;
};

export function AnimeLibrarySection({
  anilistId,
  entry,
  anime,
}: AnimeLibrarySectionProps) {
  const [showEditor, setShowEditor] = useState(false);

  const libraryEntry: LibraryEntry | null = entry
    ? { ...entry, anime }
    : null;
  const title =
    anime.english_title ||
    anime.romaji_title ||
    anime.native_title ||
    "Anime";

  function formatDate(value: string | null) {
    if (!value) return null;
    const date = value.includes("T")
      ? new Date(value)
      : new Date(`${value}T00:00:00Z`);

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  const startedDate = libraryEntry ? formatDate(libraryEntry.started_at) : null;
  const completedDate = libraryEntry
    ? formatDate(libraryEntry.completed_at)
    : null;
  const updatedDate = libraryEntry ? formatDate(libraryEntry.updated_at) : null;

  return (
    <section className="card p-6">
      <h2 className="font-display text-xl font-semibold">Your list</h2>
      <p className="mt-0.5 text-sm text-muted">
        Track this title or update where it sits.
      </p>
      <StatusPicker
        anilistId={anilistId}
        currentStatus={(entry?.status as AnimeEntryStatus) ?? null}
      />

      {libraryEntry ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-line bg-surface-2/40 p-3 text-sm">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Status
                </dt>
                <dd className="mt-0.5 text-ink">
                  {STATUS_LABELS[libraryEntry.status]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Progress
                </dt>
                <dd className="mt-0.5 text-ink">
                  {libraryEntry.progress_episodes}
                  {anime.episodes ? ` / ${anime.episodes}` : ""} episodes
                </dd>
              </div>
              {libraryEntry.personal_score != null ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Score
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {Number(libraryEntry.personal_score)}/10
                  </dd>
                </div>
              ) : null}
              {libraryEntry.priority ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Priority
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {WATCHLIST_PRIORITY_LABELS[libraryEntry.priority]}
                  </dd>
                </div>
              ) : null}
              {libraryEntry.rewatch_count > 0 ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Rewatches
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {libraryEntry.rewatch_count}
                  </dd>
                </div>
              ) : null}
              {startedDate ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Started
                  </dt>
                  <dd className="mt-0.5 text-ink">{startedDate}</dd>
                </div>
              ) : null}
              {completedDate ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Completed
                  </dt>
                  <dd className="mt-0.5 text-ink">{completedDate}</dd>
                </div>
              ) : null}
              {updatedDate ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-faint">
                    Updated
                  </dt>
                  <dd className="mt-0.5 text-ink">{updatedDate}</dd>
                </div>
              ) : null}
            </dl>
            {libraryEntry.notes ? (
              <p className="mt-3 border-t border-line pt-3 text-muted">
                <span className="font-medium text-ink">Notes:</span>
                <br />
                {libraryEntry.notes}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowEditor((open) => !open)}
            >
              Edit details
            </Button>
            <Link
              href="/library"
              className="font-medium text-accent hover:underline"
            >
              View library
            </Link>
            {libraryEntry.status === "completed" ? (
              <Link
                href="/ranking"
                className="font-medium text-accent hover:underline"
              >
                Ranking
              </Link>
            ) : null}
          </div>

          {showEditor ? (
            <Dialog
              open
              onClose={() => setShowEditor(false)}
              title={title}
              subtitle="Edit entry"
              maxWidthClassName="max-w-2xl"
            >
              <EntryEditPanel
                key={libraryEntry.id}
                entry={libraryEntry}
                onClose={() => setShowEditor(false)}
              />
            </Dialog>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
