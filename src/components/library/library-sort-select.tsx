"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
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
      className={`h-4 w-4 transition-transform ${
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

  function onChangeSort(nextSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === defaultSortForStatus(status)) {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }
    // Reset to the new sort's natural direction when switching fields.
    params.delete("dir");
    pushParams(params);
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
    <div className="flex items-center gap-2">
      <Label htmlFor="library-sort" className="mb-0 shrink-0">
        Sort
      </Label>
      <select
        id="library-sort"
        value={current}
        onChange={(e) => onChangeSort(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-line-strong bg-paper px-3 py-2.5 text-base text-ink sm:text-sm"
      >
        {options.map((key) => (
          <option key={key} value={key}>
            {LIBRARY_SORT_LABELS[key]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={toggleDirection}
        aria-label={
          direction === "asc" ? "Sorting ascending" : "Sorting descending"
        }
        title={direction === "asc" ? "Ascending" : "Descending"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-paper text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <DirectionArrow direction={direction} />
      </button>
    </div>
  );
}
