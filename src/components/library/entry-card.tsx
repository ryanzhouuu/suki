"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { removeAnimeEntry, updateAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import {
  STATUS_LABELS,
  WATCHLIST_PRIORITY_LABELS,
  type AnimeEntryStatus,
} from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";

type EntryCardProps = {
  entry: LibraryEntry;
  onEdit?: () => void;
  isEditing?: boolean;
};

export function EntryCard({ entry, onEdit, isEditing = false }: EntryCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] =
    useState<AnimeEntryStatus | null>(null);

  if (optimisticStatus !== null && entry.status === optimisticStatus) {
    setOptimisticStatus(null);
  }

  const displayStatus = optimisticStatus ?? entry.status;

  const anime = entry.anime;
  const title =
    anime.english_title ||
    anime.romaji_title ||
    anime.native_title ||
    "Unknown";
  const total = anime.episodes;
  const isWatching = displayStatus === "watching";
  const hasTotal = total != null && total > 0;
  const progressPct =
    hasTotal && entry.progress_episodes > 0
      ? Math.min(100, Math.round((entry.progress_episodes / total) * 100))
      : 0;

  function setStatus(status: AnimeEntryStatus) {
    setOptimisticStatus(status);
    startTransition(async () => {
      const result = await updateAnimeEntry(entry.id, { status });
      if (result.error) {
        setOptimisticStatus(null);
      } else {
        router.refresh();
      }
    });
  }

  function remove() {
    if (!confirm("Remove from your library?")) return;
    startTransition(async () => {
      await removeAnimeEntry(entry.id);
      router.refresh();
    });
  }

  const meta: string[] = [];
  if (entry.personal_score != null) {
    meta.push(`${Number(entry.personal_score)}/10`);
  }
  if (entry.priority) {
    meta.push(`${WATCHLIST_PRIORITY_LABELS[entry.priority]} priority`);
  }
  if (entry.completed_at) {
    meta.push(`Done ${entry.completed_at}`);
  }

  return (
    <li
      className={`group flex flex-col overflow-hidden rounded-lg border bg-surface transition-colors hover:border-accent ${
        isEditing ? "border-accent ring-2 ring-accent/20" : "border-line"
      }`}
    >
      <Link
        href={`/anime/${anime.anilist_id}`}
        className="block overflow-hidden"
      >
        <AnimePoster
          src={anime.cover_image_url}
          alt={title}
          fill
          className="rounded-none transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-2.5">
        <Link
          href={`/anime/${anime.anilist_id}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors hover:text-accent"
        >
          {title}
        </Link>

        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 font-medium text-ink">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {STATUS_LABELS[displayStatus as AnimeEntryStatus]}
          </span>
          {!isWatching && entry.progress_episodes > 0 ? (
            <span>
              {entry.progress_episodes}
              {total ? ` / ${total}` : ""} eps
            </span>
          ) : null}
        </p>

        {meta.length > 0 ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted">{meta.join(" · ")}</p>
        ) : null}

        {isWatching ? (
          <div className="mt-2">
            <p className="mb-1 text-[11px] text-muted">
              <span className="font-medium text-ink">
                EP {entry.progress_episodes}
              </span>
              {hasTotal ? ` / ${total}` : " · ongoing"}
            </p>
            <div className="h-0.5 overflow-hidden rounded-full bg-surface-2">
              {hasTotal ? (
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              ) : (
                <div
                  aria-hidden
                  className="h-full w-full rounded-full"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, var(--line-strong) 0 4px, transparent 4px 8px)",
                  }}
                />
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={pending}
                className="px-2 text-[11px] sm:px-3 sm:text-xs"
                onClick={() =>
                  startTransition(async () => {
                    await updateAnimeEntry(entry.id, {
                      progressEpisodes: hasTotal
                        ? Math.min(entry.progress_episodes + 1, total)
                        : entry.progress_episodes + 1,
                    });
                    router.refresh();
                  })
                }
              >
                +1 ep
              </Button>
              {hasTotal && entry.progress_episodes >= total ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  className="px-2 text-[11px] sm:px-3 sm:text-xs"
                  onClick={() => setStatus("completed")}
                >
                  Done
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-1 pt-2">
          {onEdit ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              className="px-2 text-[11px] sm:px-3 sm:text-xs"
              onClick={onEdit}
            >
              Edit
            </Button>
          ) : null}
          {displayStatus !== "completed" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              className="px-2 text-[11px] sm:px-3 sm:text-xs"
              onClick={() => setStatus("completed")}
            >
              Completed
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            className="px-2 text-[11px] sm:px-3 sm:text-xs"
            onClick={remove}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
