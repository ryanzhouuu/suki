"use client";

import Link from "next/link";
import { useState } from "react";

import { EntryEditPanel } from "@/components/library/entry-edit-panel";
import { StatusPicker } from "@/components/anime/status-picker";
import { Button } from "@/components/ui/button";
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
          <div className="rounded-lg border border-line bg-surface-2/40 p-3 text-sm text-muted">
            <p>
              <span className="font-medium text-ink">Status:</span>{" "}
              {STATUS_LABELS[libraryEntry.status]}
            </p>
            {libraryEntry.progress_episodes > 0 ? (
              <p className="mt-1">
                <span className="font-medium text-ink">Progress:</span>{" "}
                {libraryEntry.progress_episodes}
                {anime.episodes ? ` / ${anime.episodes}` : ""} episodes
              </p>
            ) : null}
            {libraryEntry.personal_score != null ? (
              <p className="mt-1">
                <span className="font-medium text-ink">Your score:</span>{" "}
                {Number(libraryEntry.personal_score)}/10
              </p>
            ) : null}
            {libraryEntry.priority ? (
              <p className="mt-1">
                <span className="font-medium text-ink">Priority:</span>{" "}
                {WATCHLIST_PRIORITY_LABELS[libraryEntry.priority]}
              </p>
            ) : null}
            {libraryEntry.notes ? (
              <p className="mt-1 line-clamp-3">
                <span className="font-medium text-ink">Notes:</span>{" "}
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
              {showEditor ? "Hide editor" : "Edit details"}
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
            <EntryEditPanel
              key={libraryEntry.id}
              entry={libraryEntry}
              onClose={() => setShowEditor(false)}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
