"use client";

import { useState } from "react";

import { AnimePoster } from "@/components/anime/anime-poster";
import { EntryCard } from "@/components/library/entry-card";
import { STATUS_LABELS } from "@/lib/constants";
import { statusSummary, type LibraryGroup } from "@/lib/library/group";

type SeriesGroupCardProps = {
  group: LibraryGroup;
  editingEntryId: string | null;
  onEdit: (entryId: string) => void;
};

export function SeriesGroupCard({
  group,
  editingEntryId,
  onEdit,
}: SeriesGroupCardProps) {
  const [expanded, setExpanded] = useState(false);

  const series = group.series;
  const title = series?.canonical_title ?? "Unknown series";
  const count = group.entries.length;
  const countLabel = `${count} ${count === 1 ? "entry" : "entries"}`;
  const summary = statusSummary(group);

  return (
    <li className="overflow-hidden rounded-lg border border-line bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="group flex w-full items-stretch gap-3 text-left transition-colors hover:border-accent"
      >
        <div className="shrink-0 py-2.5 pl-2.5">
          <AnimePoster src={series?.cover_image_url ?? null} alt={title} size="sm" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-2.5 pr-3">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink transition-colors group-hover:text-accent">
            {title}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 font-medium text-ink">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {STATUS_LABELS[group.primaryStatus]}
            </span>
            <span>{countLabel}</span>
          </p>
          {summary ? (
            <p className="mt-1 line-clamp-1 text-[11px] text-muted">{summary}</p>
          ) : null}
        </div>

        <span
          className="flex shrink-0 items-center pr-3 text-muted transition-colors group-hover:text-accent"
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {expanded ? (
        <ul className="grid grid-cols-2 gap-2.5 border-t border-line p-2.5 lg:grid-cols-3">
          {group.entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => onEdit(entry.id)}
              isEditing={editingEntryId === entry.id}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
