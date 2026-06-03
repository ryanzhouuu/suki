"use client";

import Link from "next/link";
import { useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { DiscoverAnimeItem } from "@/lib/anilist/discover";

const COLLAPSED_COUNT = 6;

type DiscoverRowProps = {
  title: string;
  eyebrow?: string;
  items: DiscoverAnimeItem[];
};

export function DiscoverRow({ title, eyebrow, items }: DiscoverRowProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const canExpand = items.length > COLLAPSED_COUNT;
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
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
        {canExpand ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 self-start text-sm font-medium text-muted transition-colors hover:text-accent sm:self-auto"
          >
            {expanded ? "Show less" : `Show all (${items.length})`}
          </button>
        ) : null}
      </div>

      <ul className="-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:thin] snap-x snap-mandatory [touch-action:pan-x]">
        {visible.map((item) => (
          <li key={item.anilistId} className="w-[7.25rem] shrink-0 snap-start sm:w-32">
            <Link
              href={`/anime/${item.anilistId}`}
              className="group block"
            >
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
    </section>
  );
}
