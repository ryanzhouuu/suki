import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { LibraryEntry } from "@/lib/library/queries";

type ProfileAnimeSectionProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  entries: LibraryEntry[];
  showScore?: boolean;
  showCompletedDate?: boolean;
  /** "grid" shows a 2-up grid; "list" stacks a single column (for side-by-side columns). */
  layout?: "grid" | "list";
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
  className = "",
}: ProfileAnimeSectionProps) {
  if (entries.length === 0) return null;

  return (
    <section
      id={id}
      className={`flex flex-col rounded-card border border-line bg-surface p-5 sm:p-6 ${id ? "scroll-mt-28" : ""} ${className}`}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3
        className={`${eyebrow ? "mt-1" : ""} mb-4 text-xl font-semibold`}
      >
        {title}
      </h3>
      <ul
        className={`grid flex-1 gap-3 ${
          layout === "grid" ? "sm:grid-cols-2" : "content-start"
        }`}
      >
        {entries.map((entry) => {
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
            <li key={entry.id}>
              <Link
                href={`/anime/${entry.anime.anilist_id}`}
                className="group flex items-center gap-3 rounded-card border border-line bg-surface-2/50 p-3 transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-surface"
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
                    <p className="mt-0.5 text-xs text-muted">{meta.join(" · ")}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
