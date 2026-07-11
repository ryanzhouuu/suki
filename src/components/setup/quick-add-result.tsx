"use client";

import { useState, useTransition } from "react";

import { addAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { getAniListDisplayTitle } from "@/lib/anilist/display";
import type { AniListMediaSummary } from "@/lib/anilist/types";
import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";

const STATUSES: AnimeEntryStatus[] = ["plan_to_watch", "watching", "completed"];

type QuickAddResultProps = {
  media: AniListMediaSummary;
  initialStatus?: AnimeEntryStatus;
  onAdded?: (anilistId: number, status: AnimeEntryStatus) => void;
};

export function QuickAddResult({
  media,
  initialStatus,
  onAdded,
}: QuickAddResultProps) {
  const [pending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<AnimeEntryStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const activeStatus = selectedStatus ?? initialStatus ?? null;
  const title = getAniListDisplayTitle(media.title);

  function quickAdd(status: AnimeEntryStatus) {
    setError(null);
    setSelectedStatus(status);
    startTransition(async () => {
      const result = await addAnimeEntry(media.id, status);
      if (result.error) {
        setError(result.error);
        setSelectedStatus(initialStatus ?? null);
        return;
      }
      onAdded?.(media.id, status);
    });
  }

  return (
    <li className="rounded-xl border border-line bg-surface p-3">
      <div className="flex gap-3">
        <AnimePoster
          src={media.coverImage?.large ?? null}
          alt={title}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{title}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-faint">
            {[media.format, media.seasonYear]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col justify-center gap-1">
          {STATUSES.map((status) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                type="button"
                disabled={pending}
                onClick={() => quickAdd(status)}
                className={`rounded-md border px-2 py-1 text-left text-[11px] font-medium transition-colors disabled:opacity-60 ${
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
      </div>

      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}
