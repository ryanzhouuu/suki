"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { STATUS_LABELS, type AnimeEntryStatus } from "@/lib/constants";

const STATUS_OPTIONS: { key: AnimeEntryStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "watching", label: STATUS_LABELS.watching },
  { key: "completed", label: STATUS_LABELS.completed },
  { key: "plan_to_watch", label: STATUS_LABELS.plan_to_watch },
  { key: "paused", label: STATUS_LABELS.paused },
  { key: "dropped", label: STATUS_LABELS.dropped },
];

export function LibraryStatusFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  return (
    <nav aria-label="Library status" className="space-y-1">
      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-faint">
        Status
      </p>
      <div className="grid gap-1">
        {STATUS_OPTIONS.map((option) => {
          const params = new URLSearchParams(searchParams.toString());
          if (option.key === "all") {
            params.delete("status");
          } else {
            params.set("status", option.key);
          }
          const qs = params.toString();
          const href = qs ? `${pathname}?${qs}` : pathname;
          const active = current === option.key;

          return (
            <Link
              key={option.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? "bg-accent text-on-accent shadow-sm"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
