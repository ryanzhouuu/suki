"use client";

import { useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import {
  libraryEntryTitle,
  libraryGroupCover,
  libraryGroupTitle,
  SeriesGroupDetailsDialog,
} from "@/components/library/series-group-details-dialog";
import { STATUS_LABELS } from "@/lib/constants";
import { statusSummary, type LibraryGroup } from "@/lib/library/group";

type SeriesGroupCardProps = {
  group: LibraryGroup;
};

export function SeriesGroupCard({ group }: SeriesGroupCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const title = libraryGroupTitle(group);
  const count = group.entries.length;
  const countLabel = `${count} ${count === 1 ? "entry" : "entries"}`;
  const summary = statusSummary(group);
  const previewEntries = group.entries.slice(0, 3);
  const hiddenCount = Math.max(0, count - previewEntries.length);
  const cover = libraryGroupCover(group);

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
                    {libraryEntryTitle(entry)}
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

      <SeriesGroupDetailsDialog
        group={group}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
