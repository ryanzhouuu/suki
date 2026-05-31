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
    <li className="flex gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <Link href={`/anime/${anime.anilist_id}`} className="shrink-0">
        <AnimePoster src={anime.cover_image_url} alt={title} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/anime/${anime.anilist_id}`} className="font-medium hover:underline">
          {title}
        </Link>
        <p className="text-xs text-zinc-500">
          {STATUS_LABELS[entry.status]}
          {entry.progress_episodes > 0
            ? ` · ${entry.progress_episodes}${anime.episodes ? `/${anime.episodes}` : ""} eps`
            : ""}
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
