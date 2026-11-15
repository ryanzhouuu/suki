"use client";

import { useMemo, useState } from "react";

import {
  FocusedRecommendationCard,
  recommendationArtwork,
} from "@/components/recommendations/focused-recommendation-card";
import { RecommendationsStage } from "@/components/recommendations/recommendations-stage";
import { nextIndexAfterDismiss } from "@/lib/recommendations/carousel";
import type { RecommendationRow } from "@/lib/recommendations/types";

type FocusedRecommendationsProps = {
  items: RecommendationRow[];
  contextLabel?: string;
  whyLabel?: string;
  /** TMDB backdrops keyed by AniList id; picks without one use AniList art. */
  artwork?: Record<number, string>;
};

function CarouselChevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
        direction === "prev" ? "rotate-180" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CarouselArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="group relative z-20 flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-muted shadow-[0_8px_24px_-12px_rgb(var(--shadow-color)/0.45)] transition-colors hover:border-accent hover:bg-surface hover:text-accent disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12"
    >
      <CarouselChevron direction={direction} />
    </button>
  );
}

export function FocusedRecommendations({
  items,
  contextLabel,
  whyLabel,
  artwork = {},
}: FocusedRecommendationsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleItems = useMemo(
    () => items.filter((row) => !dismissedIds.has(row.id)),
    [items, dismissedIds],
  );

  if (visibleItems.length === 0) {
    return (
      <RecommendationsStage>
        <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-display text-xl text-ink">No picks left in this set</p>
          <p className="mt-2 text-sm text-muted">
            Use <strong className="text-ink">Get recommendations</strong> above to
            refresh your list.
          </p>
        </div>
      </RecommendationsStage>
    );
  }

  const safeIndex = Math.min(activeIndex, visibleItems.length - 1);
  const current = visibleItems[safeIndex];
  const canScroll = visibleItems.length > 1;

  function goNext() {
    if (!canScroll) return;
    setActiveIndex((index) => (index + 1) % visibleItems.length);
  }

  function goPrev() {
    if (!canScroll) return;
    setActiveIndex(
      (index) => (index - 1 + visibleItems.length) % visibleItems.length,
    );
  }

  function handleDismissed() {
    setDismissedIds((prev) => new Set(prev).add(current.id));
    setActiveIndex((index) => nextIndexAfterDismiss(index, visibleItems.length));
  }

  const currentArt =
    recommendationArtwork(current, artwork[current.anime.anilist_id]) ??
    current.anime.cover_image_url;

  return (
    <div className="relative isolate">
      <div className="relative z-10 space-y-5 sm:space-y-6">
        <RecommendationsStage
          leading={
            <span className="hidden sm:inline-flex">
              <CarouselArrow
                direction="prev"
                label="Previous recommendation"
                disabled={!canScroll}
                onClick={goPrev}
              />
            </span>
          }
          trailing={
            <span className="hidden sm:inline-flex">
              <CarouselArrow
                direction="next"
                label="Next recommendation"
                disabled={!canScroll}
                onClick={goNext}
              />
            </span>
          }
        >
          <div className="relative">
            {/* Light spilling off the screen onto the page, keyed to the current pick. */}
            {currentArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`glow-${current.id}`}
                src={currentArt}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-x-[6%] top-[12%] -z-10 h-[80%] w-[88%] animate-fade object-cover opacity-40 blur-3xl saturate-150"
              />
            ) : null}
            <div key={current.id} className="animate-fade">
              <FocusedRecommendationCard
                row={current}
                index={safeIndex}
                total={visibleItems.length}
                onDismissed={handleDismissed}
                contextLabel={contextLabel}
                whyLabel={whyLabel}
                artworkUrl={artwork[current.anime.anilist_id]}
              />
            </div>
            {/* Phones get the arrows under the card so they never cover its copy. */}
            {canScroll ? (
              <div className="mt-3 flex items-center justify-between sm:hidden">
                <CarouselArrow
                  direction="prev"
                  label="Previous recommendation"
                  disabled={!canScroll}
                  onClick={goPrev}
                />
                <p className="text-xs font-medium text-muted tabular-nums">
                  {safeIndex + 1} / {visibleItems.length}
                </p>
                <CarouselArrow
                  direction="next"
                  label="Next recommendation"
                  disabled={!canScroll}
                  onClick={goNext}
                />
              </div>
            ) : null}
          </div>
        </RecommendationsStage>

        {canScroll ? (
          <RecommendationsStage>
            <div>
              <p className="credit-line">Up next</p>
              {/* The scroller clips on both axes; the inset padding leaves room for the active ring. */}
              <ul className="-mx-1 mt-2 flex gap-2.5 overflow-x-auto p-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleItems.map((row, index) => {
                  const active = index === safeIndex;
                  const title =
                    row.anime.english_title || row.anime.romaji_title || "Pick";
                  const thumb =
                    recommendationArtwork(row, artwork[row.anime.anilist_id]) ??
                    row.anime.cover_image_url;
                  return (
                    <li key={row.id} className="shrink-0">
                      <button
                        type="button"
                        aria-label={`Go to ${title}`}
                        aria-current={active ? "true" : undefined}
                        onClick={() => setActiveIndex(index)}
                        className={`block aspect-video w-32 overflow-hidden rounded-md bg-surface-2 transition-opacity sm:w-40 ${
                          active
                            ? "ring-2 ring-accent ring-offset-2 ring-offset-paper"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </RecommendationsStage>
        ) : null}
      </div>
    </div>
  );
}
