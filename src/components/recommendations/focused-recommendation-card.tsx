"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  dismissRecommendation,
  logRecommendationAdded,
  logRecommendationClicked,
} from "@/actions/recommendations";
import { addAnimeEntry } from "@/actions/library";
import { CreditLine } from "@/components/home/credit-line";
import { ArtworkField, heroGhostClass, heroPrimaryClass } from "@/components/home/hero-frame";
import { STATUS_LABELS } from "@/lib/constants";
import type { CreditPart } from "@/lib/home/featured";
import type { RecommendationExplanationBadge, RecommendationRow } from "@/lib/recommendations/types";

const BADGE_LABELS: Record<RecommendationExplanationBadge, string> = {
  strong_match: "Strong match",
  genre_match: "Genre match",
  request_match: "Matches request",
  community_score: "Well rated",
  popular: "Popular",
  diverse_pick: "Varied pick",
  wildcard_pick: "Wildcard",
};

type FocusedRecommendationCardProps = {
  row: RecommendationRow;
  index: number;
  total: number;
  onDismissed: () => void;
  contextLabel?: string;
  whyLabel?: string;
  /** Landscape backdrop (TMDB) that wins over the AniList banner. */
  artworkUrl?: string | null;
};

/** Best wide image for a pick: TMDB backdrop, then the AniList banner. */
export function recommendationArtwork(
  row: RecommendationRow,
  artworkUrl?: string | null,
): string | null {
  return artworkUrl ?? row.anime.banner_image_url ?? null;
}

/**
 * One recommendation as a fixed-size screen: the artwork fills the frame and
 * the copy sits on a left-weighted shade, so every pick lands at the same size.
 */
export function FocusedRecommendationCard({
  row,
  index,
  total,
  onDismissed,
  contextLabel = "Recommendation",
  whyLabel = "Why this pick",
  artworkUrl,
}: FocusedRecommendationCardProps) {
  const [pending, startTransition] = useTransition();
  const [libraryStatus, setLibraryStatus] = useState(row.libraryEntry?.status ?? null);
  const anime = row.anime;
  const title = anime.english_title || anime.romaji_title || "Unknown";
  const details = row.parsedExplanationDetails;
  const explanation = details?.primaryReason ?? row.explanation;
  const secondarySignals = details?.secondarySignals ?? [];
  const badges = details?.badges ?? [];
  const wideArt = recommendationArtwork(row, artworkUrl);

  const credit: CreditPart[] = [
    { text: `${contextLabel} ${index + 1} of ${total}`, tone: "strong" },
    ...[anime.format, anime.season_year, anime.episodes ? `${anime.episodes} eps` : null]
      .filter(Boolean)
      .map((text) => ({ text: String(text) })),
    ...(anime.average_score ? [{ text: `★ ${anime.average_score}`, tone: "accent" as const }] : []),
  ];

  function addStatus(status: "plan_to_watch" | "watching") {
    startTransition(async () => {
      await addAnimeEntry(anime.anilist_id, status);
      await logRecommendationAdded(anime.id, status);
      setLibraryStatus(status);
    });
  }

  function dismiss() {
    startTransition(async () => {
      await dismissRecommendation(anime.id);
      onDismissed();
    });
  }

  return (
    <article className="relative isolate h-[38rem] overflow-hidden rounded-card bg-paper ring-1 ring-white/10 sm:h-[32rem] lg:h-[36rem]">
      {wideArt ? (
        <ArtworkField src={wideArt} />
      ) : (
        <PosterOnlyArt coverUrl={anime.cover_image_url} />
      )}

      {libraryStatus ? (
        <p className="absolute top-4 right-4 z-10 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm sm:top-6 sm:right-6">
          In library: {STATUS_LABELS[libraryStatus]}
        </p>
      ) : null}

      <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end p-5 sm:p-8 lg:p-10">
        {!wideArt && anime.cover_image_url ? (
          // Poster-only titles keep their key art visible above the copy.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anime.cover_image_url}
            alt=""
            className="mb-5 aspect-[2/3] w-20 rounded-md object-cover shadow-[0_20px_40px_-16px_rgb(0_0_0/0.8)] ring-1 ring-white/15 sm:w-24"
          />
        ) : null}
        <CreditLine parts={credit} onArt />
        <h2 className="mt-2 line-clamp-2 text-balance font-display text-3xl font-medium leading-[1.05] text-white sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        {anime.genres.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/70" aria-label="Genres">
            {anime.genres.slice(0, 5).map((genre) => (
              <li key={genre}>{genre}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 border-l-2 border-accent pl-4">
          <p className="text-xs font-medium text-white/60">{whyLabel}</p>
          <p className="mt-1 line-clamp-3 text-[0.95rem] leading-relaxed text-white/90">
            {explanation}
          </p>
          {secondarySignals.length > 0 ? (
            <ul className="mt-2 hidden space-y-0.5 text-sm text-white/60 sm:block">
              {secondarySignals.slice(0, 2).map((signal) => (
                <li key={signal} className="line-clamp-1">
                  {signal}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {badges.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <li
                key={badge}
                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/85 backdrop-blur-sm"
              >
                {BADGE_LABELS[badge]}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className={`${heroPrimaryClass} disabled:opacity-50`}
            disabled={pending || libraryStatus != null}
            onClick={() => addStatus("plan_to_watch")}
          >
            Plan to watch
          </button>
          <button
            type="button"
            className={`${heroGhostClass} disabled:opacity-50`}
            disabled={pending || libraryStatus === "watching"}
            onClick={() => addStatus("watching")}
          >
            Start watching
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-white/65 transition-colors hover:text-white disabled:opacity-50"
            disabled={pending}
            onClick={dismiss}
          >
            Not interested
          </button>
          <Link
            href={`/anime/${anime.anilist_id}`}
            onClick={() => {
              void logRecommendationClicked(anime.id);
            }}
            className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-white/65 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Open details
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Fallback when a title has no landscape art: the cover blurred into a wash. */
function PosterOnlyArt({ coverUrl }: { coverUrl: string | null }) {
  return (
    <div className="artwork-field" aria-hidden="true">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-2xl saturate-150"
        />
      ) : (
        <div className="artwork-field__glow" />
      )}
      <div className="artwork-field__shade" />
    </div>
  );
}
