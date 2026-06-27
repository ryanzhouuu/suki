"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { addAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { getAniListDisplayTitle } from "@/lib/anilist/display";
import type { AniListMediaSummary } from "@/lib/anilist/types";
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";

const STATUSES: AnimeEntryStatus[] = ["plan_to_watch", "watching", "completed"];

type SearchResultCardProps = {
  media: AniListMediaSummary;
  initialStatus?: AnimeEntryStatus;
};

export function SearchResultCard({ media, initialStatus }: SearchResultCardProps) {
  const [pending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<AnimeEntryStatus | null>(null);
  const activeStatus = selectedStatus ?? initialStatus ?? null;
  const title = getAniListDisplayTitle(media.title);
  const genres = media.genres ?? [];

  function quickAdd(status: AnimeEntryStatus) {
    setSelectedStatus(status);
    startTransition(async () => {
      await addAnimeEntry(media.id, status);
    });
  }

  return (
    <li className="group flex gap-4 rounded-card border border-line bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_16px_40px_-28px_rgb(var(--shadow-color)/0.5)]">
      <Link href={`/anime/${media.id}`} className="shrink-0">
        <AnimePoster
          src={media.coverImage?.large ?? null}
          alt={title}
          size="md"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/anime/${media.id}`}
          className="font-medium text-ink transition-colors hover:text-accent"
        >
          {title}
        </Link>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-faint">
          {[media.format, media.seasonYear, media.episodes && `${media.episodes} eps`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {genres.length > 0 ? (
          <p className="mt-1 text-xs text-muted">{genres.slice(0, 4).join(" · ")}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col justify-center gap-1.5">
        {STATUSES.map((status) => {
          const isActive = activeStatus === status;
          return (
            <button
              key={status}
              type="button"
              disabled={pending}
              onClick={() => quickAdd(status)}
              className={`w-30 rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-colors disabled:opacity-60 ${
                isActive
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line-strong text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </li>
  );
}
