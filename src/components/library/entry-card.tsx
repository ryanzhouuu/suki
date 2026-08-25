"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { removeAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { EpisodeTicker } from "@/components/library/episode-ticker";
import {
  STATUS_LABELS,
  WATCHLIST_PRIORITY_LABELS,
} from "@/lib/constants";
import type { LibraryEntry } from "@/lib/library/queries";

type EntryCardProps = {
  entry: LibraryEntry;
  onEdit?: () => void;
  isEditing?: boolean;
};

export function EntryCard({ entry, onEdit, isEditing = false }: EntryCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const anime = entry.anime;
  const title =
    anime.english_title ||
    anime.romaji_title ||
    anime.native_title ||
    "Unknown";
  const total = anime.episodes;
  const isWatching = entry.status === "watching";
  const hasTotal = total != null && total > 0;

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnMouseDown(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }

    function closeOnFocusIn(event: FocusEvent) {
      const target = event.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }

    function closeOnKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnMouseDown);
    document.addEventListener("focusin", closeOnFocusIn);
    document.addEventListener("keydown", closeOnKeyDown);

    return () => {
      document.removeEventListener("mousedown", closeOnMouseDown);
      document.removeEventListener("focusin", closeOnFocusIn);
      document.removeEventListener("keydown", closeOnKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
  }, [menuOpen]);

  function remove() {
    setMenuOpen(false);
    if (!confirm("Remove from your library?")) return;
    startTransition(async () => {
      await removeAnimeEntry(entry.id);
      router.refresh();
    });
  }

  const meta: string[] = [];
  if (entry.personal_score != null) {
    meta.push(`${Number(entry.personal_score)}/10`);
  }
  if (entry.priority) {
    meta.push(`${WATCHLIST_PRIORITY_LABELS[entry.priority]} priority`);
  }
  if (entry.completed_at) {
    meta.push(`Done ${entry.completed_at}`);
  }

  return (
    <li
      className={`group flex flex-col overflow-hidden rounded-lg border bg-surface transition-colors hover:border-accent ${
        isEditing ? "border-accent ring-2 ring-accent/20" : "border-line"
      }`}
    >
      <div className="relative">
        <Link
          href={`/anime/${anime.anilist_id}`}
          className="block overflow-hidden"
        >
          <AnimePoster
            src={anime.cover_image_url}
            alt={title}
            fill
            className="rounded-none transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 inline-flex max-w-[calc(100%-4.5rem)] items-center gap-1 rounded-full border border-paper/50 bg-paper/90 px-2 py-1 text-[10px] font-semibold leading-none text-ink shadow-sm backdrop-blur-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span className="truncate">{STATUS_LABELS[entry.status]}</span>
        </span>

        <div ref={menuRef} className="absolute right-2.5 top-2.5 z-20">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={`More actions for ${title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={`entry-actions-${entry.id}`}
            disabled={pending}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-paper/45 bg-ink/80 text-on-accent shadow-[0_5px_16px_rgb(var(--shadow-color)/0.35)] backdrop-blur-sm transition-all duration-150 hover:scale-105 hover:bg-ink focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path d="M10 6.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM10 11.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM10 15.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
            </svg>
          </button>

          {menuOpen ? (
            <div
              id={`entry-actions-${entry.id}`}
              role="menu"
              aria-label={`Actions for ${title}`}
              onKeyDown={(event) => {
                const items = Array.from(
                  event.currentTarget.querySelectorAll<HTMLButtonElement>(
                    '[role="menuitem"]',
                  ),
                );
                const currentIndex = items.indexOf(
                  event.target as HTMLButtonElement,
                );

                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const direction = event.key === "ArrowDown" ? 1 : -1;
                  const nextIndex =
                    (currentIndex + direction + items.length) % items.length;
                  items[nextIndex]?.focus();
                }

                if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  const nextItem = event.key === "Home" ? items[0] : items.at(-1);
                  nextItem?.focus();
                }
              }}
              className="absolute right-0 top-[calc(100%+0.5rem)] min-w-32 origin-top-right rounded-xl border border-line bg-surface/95 p-1 shadow-[0_18px_38px_-18px_rgb(var(--shadow-color)/0.65)] backdrop-blur-md animate-rise"
            >
              {onEdit ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={pending}
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-surface-2 hover:text-accent focus:bg-surface-2 focus:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Edit
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={remove}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-danger transition-colors hover:bg-accent-soft focus:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <Link
          href={`/anime/${anime.anilist_id}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors hover:text-accent"
        >
          {title}
        </Link>

        {!isWatching && entry.progress_episodes > 0 ? (
          <p className="mt-1.5 text-[11px] text-muted">
            {entry.progress_episodes}
            {total ? ` / ${total}` : ""} eps
          </p>
        ) : null}

        {meta.length > 0 ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted">{meta.join(" · ")}</p>
        ) : null}

        {isWatching ? (
          <EpisodeTicker
            entryId={entry.id}
            progressEpisodes={entry.progress_episodes}
            totalEpisodes={hasTotal ? total : null}
            className="mt-2"
          />
        ) : null}
      </div>
    </li>
  );
}
