"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import type { AnimeEntryStatus } from "@/lib/constants";
import {
  defaultSortForStatus,
  isLibrarySortKey,
  LIBRARY_SORT_LABELS,
  sortOptionsForStatus,
  type LibrarySortKey,
} from "@/lib/library/sort";

type LibrarySortSelectProps = {
  status?: AnimeEntryStatus;
};

export function LibrarySortSelect({ status }: LibrarySortSelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort");
  const current: LibrarySortKey =
    sortParam && isLibrarySortKey(sortParam)
      ? sortParam
      : defaultSortForStatus(status);

  const options = sortOptionsForStatus(status);

  function onChange(nextSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === defaultSortForStatus(status)) {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="library-sort" className="mb-0 shrink-0">
        Sort
      </Label>
      <select
        id="library-sort"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
      >
        {options.map((key) => (
          <option key={key} value={key}>
            {LIBRARY_SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}
