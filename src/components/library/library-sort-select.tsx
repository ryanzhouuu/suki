"use client";

import { useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AnimeEntryStatus } from "@/lib/constants";
import {
  defaultDirectionForSort,
  defaultSortForStatus,
  isLibrarySortKey,
  isSortDirection,
  LIBRARY_SORT_LABELS,
  sortOptionsForStatus,
  type LibrarySortKey,
  type SortDirection,
} from "@/lib/library/sort";

type LibrarySortSelectProps = {
  status?: AnimeEntryStatus;
};

function DirectionArrow({ direction }: { direction: SortDirection }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-3.5 w-3.5 transition-transform ${
        direction === "asc" ? "rotate-180" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 0 1 .75.75v9.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3.75A.75.75 0 0 1 10 3Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function LibrarySortSelect({ status }: LibrarySortSelectProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort");
  const current: LibrarySortKey =
    sortParam && isLibrarySortKey(sortParam)
      ? sortParam
      : defaultSortForStatus(status);

  const dirParam = searchParams.get("dir");
  const direction: SortDirection = isSortDirection(dirParam)
    ? dirParam
    : defaultDirectionForSort(current);

  const options = sortOptionsForStatus(status);

  function pushParams(params: URLSearchParams) {
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function onChangeSort(nextSort: LibrarySortKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === defaultSortForStatus(status)) {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }
    // Reset to the new sort's natural direction when switching fields.
    params.delete("dir");
    pushParams(params);
    setOpen(false);
  }

  function toggleDirection() {
    const next: SortDirection = direction === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultDirectionForSort(current)) {
      params.delete("dir");
    } else {
      params.set("dir", next);
    }
    pushParams(params);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="mb-0 shrink-0 text-sm font-medium text-ink">Sort</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-line-strong bg-paper px-2.5 py-1.5 text-left text-sm text-ink transition-colors hover:border-accent"
        >
          <span className="truncate">{LIBRARY_SORT_LABELS[current]}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleDirection}
          aria-label={
            direction === "asc" ? "Sorting ascending" : "Sorting descending"
          }
          title={direction === "asc" ? "Ascending" : "Descending"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-paper text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <DirectionArrow direction={direction} />
        </button>
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sort library"
          className="grid gap-1 rounded-xl border border-line bg-surface p-1"
        >
          {options.map((key) => {
            const active = key === current;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onChangeSort(key)}
                className={`flex min-h-8 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  active
                    ? "bg-accent text-on-accent"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span>{LIBRARY_SORT_LABELS[key]}</span>
                {active ? (
                  <span aria-hidden className="text-[0.65rem] font-semibold">
                    Selected
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
