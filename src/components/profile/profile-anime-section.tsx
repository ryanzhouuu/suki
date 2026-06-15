"use client";

import Link from "next/link";
import { useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { LibraryEntry } from "@/lib/library/queries";

const DEFAULT_VISIBLE = 10;

type ProfileAnimeSectionProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  entries: LibraryEntry[];
  showScore?: boolean;
  showCompletedDate?: boolean;
  /** "grid" shows a 2-up grid; "list" stacks a single column (for side-by-side columns). */
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
      className={`flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface p-5 sm:p-6 ${id ? "scroll-mt-28" : ""} ${className}`}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3
        className={`${eyebrow ? "mt-1" : ""} mb-4 text-xl font-semibold`}
      >
        {title}
      </h3>
      <ul
        className={`grid min-w-0 flex-1 gap-3 ${
          layout === "grid" ? "sm:grid-cols-2" : "content-start"
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
              <Link
                href={`/anime/${entry.anime.anilist_id}`}
                className="group flex min-w-0 items-center gap-3 rounded-card border border-line bg-surface-2/50 p-3 transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-surface"
              >
                <AnimePoster
                  src={entry.anime.cover_image_url}
                  alt={titleText}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-accent">
                    {titleText}
                  </p>
                  {meta.length > 0 ? (
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {meta.join(" · ")}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 self-start text-sm font-medium text-accent transition-colors hover:underline"
        >
          {expanded
            ? "Show less"
            : `Show all ${entries.length}`}
        </button>
      ) : null}
    </section>
  );
}
