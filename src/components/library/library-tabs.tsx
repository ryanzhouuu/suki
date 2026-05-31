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
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {TABS.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.key === "all") {
          params.delete("status");
        } else {
          params.set("status", tab.key);
        }
        const qs = params.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        const active = current === tab.key;
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-on-accent shadow-sm"
                : "border border-line-strong bg-surface text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
