"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateAnimeEntry } from "@/actions/library";
import { AnimePoster } from "@/components/anime/anime-poster";
import { EntryEditPanel } from "@/components/library/entry-edit-panel";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { STATUS_LABELS, WATCHLIST_PRIORITY_LABELS } from "@/lib/constants";
import { statusSummary, type LibraryGroup } from "@/lib/library/group";
import type { LibraryEntry } from "@/lib/library/queries";

type SeriesGroupCardProps = {
  group: LibraryGroup;
};

function entryTitle(entry: LibraryEntry): string {
  return (
    entry.anime.english_title ||
    entry.anime.romaji_title ||
    entry.anime.native_title ||
    "Unknown"
  );
}

function groupTitle(group: LibraryGroup): string {
  return group.series?.canonical_title ?? entryTitle(group.entries[0]);
}

function groupCover(group: LibraryGroup): string | null {
  return group.series?.cover_image_url ?? group.entries[0]?.anime.cover_image_url ?? null;
}

function formatEntryMeta(entry: LibraryEntry): string | null {
  const parts = [
    entry.anime.format,
    entry.anime.season_year ? String(entry.anime.season_year) : null,
    entry.anime.episodes ? `${entry.anime.episodes} eps` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatLibraryMeta(entry: LibraryEntry): string | null {
  const parts: string[] = [];
  const total = entry.anime.episodes;

  if (entry.status === "watching") {
    parts.push(`EP ${entry.progress_episodes}${total ? ` / ${total}` : ""}`);
  } else if (entry.progress_episodes > 0) {
    parts.push(`${entry.progress_episodes}${total ? ` / ${total}` : ""} eps`);
  }

  if (entry.personal_score != null) {
    parts.push(`${Number(entry.personal_score)}/10`);
  }

  if (entry.priority) {
    parts.push(`${WATCHLIST_PRIORITY_LABELS[entry.priority]} priority`);
  }

  if (entry.completed_at) {
    parts.push(`Done ${entry.completed_at}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function SeriesEntryRow({
  entry,
  onEdit,
}: {
  entry: LibraryEntry;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const title = entryTitle(entry);
  const meta = formatEntryMeta(entry);
  const libraryMeta = formatLibraryMeta(entry);
  const total = entry.anime.episodes;
  const hasTotal = total != null && total > 0;
  const canIncrement = entry.status === "watching";

  function incrementProgress() {
    startTransition(async () => {
      await updateAnimeEntry(entry.id, {
        progressEpisodes: hasTotal
          ? Math.min(entry.progress_episodes + 1, total)
          : entry.progress_episodes + 1,
      });
      router.refresh();
    });
  }

  return (
    <li className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-lg border border-line bg-surface p-2.5 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center">
      <Link
        href={`/anime/${entry.anime.anilist_id}`}
        aria-label={`View ${title}`}
        className="block shrink-0 overflow-hidden rounded-lg"
      >
        <AnimePoster
          src={entry.anime.cover_image_url}
          alt={title}
          size="sm"
          className="h-[62px] w-11 rounded-lg transition-transform duration-200 hover:scale-[1.03]"
        />
      </Link>

      <div className="min-w-0">
        <Link
          href={`/anime/${entry.anime.anilist_id}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors hover:text-accent"
        >
          {title}
        </Link>
        {meta ? (
          <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-faint">
            {meta}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 font-medium text-ink">
            <span className="h-1 w-1 rounded-full bg-accent" />
            {STATUS_LABELS[entry.status]}
          </span>
          {libraryMeta ? <span className="min-w-0 truncate">{libraryMeta}</span> : null}
        </div>
      </div>

      <div className="col-span-2 flex flex-wrap justify-end gap-1.5 sm:col-span-1 sm:flex-nowrap">
        {canIncrement ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            className="min-h-8 px-2 text-[11px]"
            onClick={incrementProgress}
          >
            +1 ep
          </Button>
        ) : null}
        <Link
          href={`/anime/${entry.anime.anilist_id}`}
          className="inline-flex min-h-8 items-center justify-center rounded-full border border-line-strong bg-surface px-2 text-[11px] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Details
        </Link>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="min-h-8 px-2 text-[11px]"
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
    </li>
  );
}

export function SeriesGroupCard({ group }: SeriesGroupCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LibraryEntry | null>(null);

  const title = groupTitle(group);
  const count = group.entries.length;
  const countLabel = `${count} ${count === 1 ? "entry" : "entries"}`;
  const summary = statusSummary(group);
  const previewEntries = group.entries.slice(0, 3);
  const hiddenCount = Math.max(0, count - previewEntries.length);
  const cover = groupCover(group);
  const editingTitle = editingEntry ? entryTitle(editingEntry) : "";

  return (
    <>
      <li className="min-w-0">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_16px_40px_-28px_rgb(var(--shadow-color)/0.5)]"
          aria-label={`Open ${title}`}
        >
          <div className="flex min-w-0 gap-3 p-3">
            <AnimePoster src={cover} alt={title} size="md" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-display text-lg font-semibold leading-tight text-ink transition-colors group-hover:text-accent">
                {title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 font-medium text-ink">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  {STATUS_LABELS[group.primaryStatus]}
                </span>
                <span>{countLabel}</span>
              </div>
              {summary ? (
                <p className="mt-1 line-clamp-1 text-[11px] text-muted">
                  {summary}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-auto border-t border-line bg-paper/35 px-3 py-2.5">
            <div className="space-y-1.5">
              {previewEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex min-w-0 items-center justify-between gap-2 text-[11px]"
                >
                  <span className="min-w-0 truncate text-muted">
                    {entryTitle(entry)}
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 font-medium text-ink">
                    {STATUS_LABELS[entry.status]}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-medium text-accent">
              {hiddenCount > 0 ? `Open ${hiddenCount} more` : "Open details"}
            </p>
          </div>
        </button>
      </li>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={title}
        subtitle={countLabel}
        maxWidthClassName="max-w-4xl"
      >
        <div className="space-y-4">
          <section className="flex min-w-0 gap-3 rounded-card border border-line bg-surface p-3 sm:gap-4 sm:p-4">
            <AnimePoster src={cover} alt={title} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-display text-2xl font-semibold leading-tight text-ink">
                {title}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 font-medium text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {STATUS_LABELS[group.primaryStatus]}
                </span>
                <span>{countLabel}</span>
              </div>
              {summary ? (
                <p className="mt-2 text-sm text-muted">{summary}</p>
              ) : null}
            </div>
          </section>

          <ul className="space-y-2">
            {group.entries.map((entry) => (
              <SeriesEntryRow
                key={entry.id}
                entry={entry}
                onEdit={() => setEditingEntry(entry)}
              />
            ))}
          </ul>
        </div>
      </Dialog>

      {editingEntry ? (
        <Dialog
          open
          onClose={() => setEditingEntry(null)}
          title={editingTitle}
          subtitle="Edit entry"
          maxWidthClassName="max-w-2xl"
        >
          <EntryEditPanel
            key={editingEntry.id}
            entry={editingEntry}
            onClose={() => setEditingEntry(null)}
          />
        </Dialog>
      ) : null}
    </>
  );
}
