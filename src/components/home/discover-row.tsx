"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { DiscoverAnimeItem } from "@/lib/anilist/discover";

type DiscoverRowProps = {
  title: string;
  eyebrow?: string;
  items: DiscoverAnimeItem[];
};

function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-5 w-5 ${direction === "prev" ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function DiscoverRow({ title, eyebrow, items }: DiscoverRowProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, items.length]);

  const scrollByPage = useCallback((direction: "prev" | "next") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 min-w-0">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2
          className={
            eyebrow
              ? "mt-1 text-xl font-semibold sm:text-2xl"
              : "text-xl font-semibold sm:text-2xl"
          }
        >
          {title}
        </h2>
      </div>

      <div className="relative">
        {/* Edge chevrons centered on the poster strip (~38% down the card,
            above the two-line caption). Hidden on touch where swiping works. */}
        <button
          type="button"
          aria-label="Scroll left"
          tabIndex={-1}
          disabled={!canPrev}
          onClick={() => scrollByPage("prev")}
          className={`absolute left-0 top-[38%] z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface text-muted shadow-[0_10px_30px_-12px_rgb(var(--shadow-color)/0.55)] transition-opacity hover:border-accent hover:text-accent sm:flex ${
            canPrev ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Chevron direction="prev" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          tabIndex={-1}
          disabled={!canNext}
          onClick={() => scrollByPage("next")}
          className={`absolute right-0 top-[38%] z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface text-muted shadow-[0_10px_30px_-12px_rgb(var(--shadow-color)/0.55)] transition-opacity hover:border-accent hover:text-accent sm:flex ${
            canNext ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Chevron direction="next" />
        </button>

        <ul
          ref={scrollerRef}
          className="-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 snap-x snap-mandatory [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <li
              key={item.anilistId}
              className="w-[7.25rem] shrink-0 snap-start sm:w-32"
            >
              <Link href={`/anime/${item.anilistId}`} className="group block">
                <AnimePoster
                  src={item.coverUrl}
                  alt={item.title}
                  fill
                  className="rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-ink transition-colors group-hover:text-accent">
                  {item.title}
                </p>
                {[item.format, item.seasonYear].filter(Boolean).length > 0 ? (
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-faint">
                    {[item.format, item.seasonYear].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
