"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";

const TABS: { key: AnimeEntryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "watching", label: STATUS_LABELS.watching },
  { key: "completed", label: STATUS_LABELS.completed },
  { key: "plan_to_watch", label: STATUS_LABELS.plan_to_watch },
  { key: "paused", label: STATUS_LABELS.paused },
  { key: "dropped", label: STATUS_LABELS.dropped },
];

export function LibraryTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {TABS.map((tab) => {
        const href =
          tab.key === "all"
            ? pathname
            : `${pathname}?status=${tab.key}`;
        const active = current === tab.key;
        return (
          <Link
            key={tab.key}
            href={href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
