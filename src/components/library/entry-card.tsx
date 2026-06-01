"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { removeAnimeEntry, updateAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";

type EntryCardProps = {
  entry: LibraryEntry;
};

export function EntryCard({ entry }: EntryCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [displayStatus, setDisplayStatus] = useState(entry.status);

  useEffect(() => {
    setDisplayStatus(entry.status);
  }, [entry.status]);

  const anime = entry.anime;
  const title =
    anime.english_title ||
    anime.romaji_title ||
    anime.native_title ||
    "Unknown";
  const total = anime.episodes;
  const progressPct =
    total && entry.progress_episodes > 0
      ? Math.min(100, Math.round((entry.progress_episodes / total) * 100))
      : 0;

  function setStatus(status: AnimeEntryStatus) {
    const previous = displayStatus;
    setDisplayStatus(status);
    startTransition(async () => {
      const result = await updateAnimeEntry(entry.id, { status });
      if (result.error) {
        setDisplayStatus(previous);
      } else {
        router.refresh();
      }
    });
  }

  function remove() {
    if (!confirm("Remove from your library?")) return;
    startTransition(async () => {
      await removeAnimeEntry(entry.id);
    });
  }

  return (
    <li className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-accent">
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
          {entry.progress_episodes > 0 ? (
            <span>
              {entry.progress_episodes}
              {total ? ` / ${total}` : ""} eps
            </span>
          ) : null}
        </p>

        {displayStatus === "watching" && total ? (
          <div className="mt-2">
            <div className="h-0.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
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
              {entry.progress_episodes >= total ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => setStatus("completed")}
                >
                  Done
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-1 pt-2">
          {displayStatus !== "completed" ? (
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
