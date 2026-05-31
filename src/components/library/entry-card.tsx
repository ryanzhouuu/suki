"use client";

import Link from "next/link";
import { useTransition } from "react";

import { removeAnimeEntry, updateAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import { getAniListDisplayTitle } from "@/lib/anilist/display";
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";

type EntryCardProps = {
  entry: LibraryEntry;
};

export function EntryCard({ entry }: EntryCardProps) {
  const [pending, startTransition] = useTransition();
  const anime = entry.anime;
  const title =
    anime.english_title ||
    anime.romaji_title ||
    anime.native_title ||
    "Unknown";

  function setStatus(status: AnimeEntryStatus) {
    startTransition(async () => {
      await updateAnimeEntry(entry.id, { status });
    });
  }

  function remove() {
    if (!confirm("Remove from your library?")) return;
    startTransition(async () => {
      await removeAnimeEntry(entry.id);
    });
  }

  return (
    <li className="group flex gap-4 rounded-card border border-line bg-surface p-3.5 transition-colors hover:border-accent">
      <Link href={`/anime/${anime.anilist_id}`} className="shrink-0">
        <AnimePoster src={anime.cover_image_url} alt={title} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/anime/${anime.anilist_id}`}
          className="font-medium text-ink transition-colors hover:text-accent"
        >
          {title}
        </Link>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {STATUS_LABELS[entry.status]}
          </span>
          {entry.progress_episodes > 0
            ? `${entry.progress_episodes}${anime.episodes ? `/${anime.episodes}` : ""} eps`
            : null}
        </p>
        {entry.status === "watching" && anime.episodes ? (
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await updateAnimeEntry(entry.id, {
                    progressEpisodes: Math.min(
                      entry.progress_episodes + 1,
                      anime.episodes ?? entry.progress_episodes + 1,
                    ),
                  });
                })
              }
            >
              +1 ep
            </Button>
            {entry.progress_episodes >= (anime.episodes ?? 0) ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => setStatus("completed")}
              >
                Mark completed
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.status !== "completed" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
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
            onClick={remove}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
