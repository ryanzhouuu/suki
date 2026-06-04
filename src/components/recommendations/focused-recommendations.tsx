"use client";

import { useMemo, useState } from "react";

import { FocusedRecommendationCard } from "@/components/recommendations/focused-recommendation-card";
import { RecommendationsStage } from "@/components/recommendations/recommendations-stage";
import type { RecommendationRow } from "@/lib/recommendations/types";

type FocusedRecommendationsProps = {
  items: RecommendationRow[];
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

export function FocusedRecommendations({ items }: FocusedRecommendationsProps) {
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
    setActiveIndex((index) =>
      index >= visibleItems.length - 1 ? 0 : index,
    );
  }

  return (
    <div className="space-y-4 pt-6 sm:pt-8">
      <RecommendationsStage
        leading={
          <CarouselArrow
            direction="prev"
            label="Previous recommendation"
            disabled={!canScroll}
            onClick={goPrev}
          />
        }
        trailing={
          <CarouselArrow
            direction="next"
            label="Next recommendation"
            disabled={!canScroll}
            onClick={goNext}
          />
        }
      >
        <FocusedRecommendationCard
          key={current.id}
          row={current}
          index={safeIndex}
          total={visibleItems.length}
          onDismissed={handleDismissed}
        />
      </RecommendationsStage>

      <RecommendationsStage>
        <div className="flex items-center justify-center gap-2">
          {visibleItems.map((row, index) => (
            <button
              key={row.id}
              type="button"
              aria-label={`Go to recommendation ${index + 1}`}
              aria-current={index === safeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === safeIndex
                  ? "w-8 bg-accent"
                  : "w-2.5 bg-line-strong hover:bg-accent/60"
              }`}
            />
          ))}
        </div>
      </RecommendationsStage>
    </div>
  );
}
