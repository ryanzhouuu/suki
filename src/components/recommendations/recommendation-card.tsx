"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  dismissRecommendation,
  logRecommendationAdded,
  logRecommendationClicked,
} from "@/actions/recommendations";
import { addAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { Button } from "@/components/ui/button";
import type { RecommendationRow } from "@/lib/recommendations/types";

type RecommendationCardProps = {
  row: RecommendationRow;
};

export function RecommendationCard({ row }: RecommendationCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();
  const anime = row.anime;
  const title = anime.english_title || anime.romaji_title || "Unknown";

  function addStatus(status: "plan_to_watch" | "watching") {
    startTransition(async () => {
      await addAnimeEntry(anime.anilist_id, status);
      await logRecommendationAdded(anime.id, status);
    });
  }

  function dismiss() {
    setDismissed(true);
    startTransition(async () => {
      await dismissRecommendation(anime.id);
    });
  }

  if (dismissed) return null;

  return (
    <li className="rounded-card border border-line bg-surface transition-colors hover:border-accent">
      <div className="flex gap-3 p-3">
        <Link
          href={`/anime/${anime.anilist_id}`}
          onClick={() => {
            void logRecommendationClicked(anime.id);
          }}
          className="shrink-0"
        >
          <AnimePoster
            src={anime.cover_image_url}
            alt={title}
            size="sm"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="min-w-0">
            <Link
              href={`/anime/${anime.anilist_id}`}
              onClick={() => {
                void logRecommendationClicked(anime.id);
              }}
              className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-accent"
            >
              {title}
            </Link>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
              {row.explanation}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => addStatus("plan_to_watch")}
            >
              Plan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => addStatus("watching")}
            >
              Watching
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={dismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
