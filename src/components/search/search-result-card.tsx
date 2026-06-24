"use client";

import Link from "next/link";
import { useTransition } from "react";

import { addAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import { getAniListDisplayTitle } from "@/lib/anilist/display";
import type { AniListMediaSummary } from "@/lib/anilist/types";
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";

type SearchResultCardProps = {
  media: AniListMediaSummary;
};

export function SearchResultCard({ media }: SearchResultCardProps) {
  const [pending, startTransition] = useTransition();
  const title = getAniListDisplayTitle(media.title);
  const genres = media.genres ?? [];

  function quickAdd(status: AnimeEntryStatus) {
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
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => quickAdd("plan_to_watch")}
          >
            {STATUS_LABELS.plan_to_watch}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => quickAdd("watching")}
          >
            {STATUS_LABELS.watching}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => quickAdd("completed")}
          >
            {STATUS_LABELS.completed}
          </Button>
        </div>
      </div>
    </li>
  );
}
