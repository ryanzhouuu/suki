"use client";

import Link from "next/link";
import { useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { LibraryEntry } from "@/lib/library/queries";

const DEFAULT_VISIBLE = 14;

type ProfileAnimeSectionProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  entries: LibraryEntry[];
  showScore?: boolean;
  showCompletedDate?: boolean;
  /** "grid" fills the width with posters; "list" keeps a narrow two-up grid. */
  layout?: "grid" | "list";
  /** When set, collapse to the first N entries with a show all/less toggle. */
  collapsible?: boolean;
  className?: string;
};

function entryTitle(entry: LibraryEntry) {
  return entry.anime.english_title || entry.anime.romaji_title;
}

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function ProfileAnimeSection({
  id,
  title,
  eyebrow,
  entries,
  showScore = false,
  showCompletedDate = false,
  layout = "grid",
  collapsible = false,
  className = "",
}: ProfileAnimeSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  const canCollapse = collapsible && entries.length > DEFAULT_VISIBLE;
  const visibleEntries =
    canCollapse && !expanded ? entries.slice(0, DEFAULT_VISIBLE) : entries;

  return (
    <section
      id={id}
      className={`min-w-0 ${id ? "scroll-mt-28" : ""} ${className}`}
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h3 className="font-display text-2xl font-medium text-ink">{title}</h3>
        {eyebrow ? <p className="text-sm text-muted">{eyebrow}</p> : null}
      </div>
      <ul
        className={`mt-5 grid min-w-0 gap-x-4 gap-y-6 ${
          layout === "grid"
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
            : "grid-cols-2"
        }`}
      >
        {visibleEntries.map((entry) => {
          const titleText = entryTitle(entry);
          const meta: string[] = [];

          if (showScore && entry.personal_score !== null) {
            meta.push(`${Number(entry.personal_score)}/10`);
          }
          if (showCompletedDate && entry.completed_at) {
            meta.push(formatDate(entry.completed_at) ?? "");
          }
          if (entry.status === "watching" && entry.anime.episodes) {
            meta.push(`${entry.progress_episodes}/${entry.anime.episodes} eps`);
          }

          return (
            <li key={entry.id} className="min-w-0">
              <Link href={`/anime/${entry.anime.anilist_id}`} className="group block">
                <AnimePoster
                  src={entry.anime.cover_image_url}
                  alt={titleText}
                  fill
                  className="rounded-md ring-1 ring-white/10 transition-opacity group-hover:opacity-85"
                />
                <p className="mt-2 line-clamp-2 text-sm leading-snug text-ink/90 transition-colors group-hover:text-accent">
                  {titleText}
                </p>
                {meta.length > 0 ? (
                  <p className="mt-0.5 truncate text-xs text-muted tabular-nums">
                    {meta.join(", ")}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-5 text-sm font-medium text-accent transition-colors hover:underline"
        >
          {expanded ? "Show less" : `Show all ${entries.length}`}
        </button>
      ) : null}
    </section>
  );
}
