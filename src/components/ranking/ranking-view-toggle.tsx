"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type RankingView = "list" | "tiers";

/** Ranking presentation synced with the `?view=` URL param (default: list). */
export function useRankingView(initial: RankingView): {
  view: RankingView;
  setView: (view: RankingView) => void;
} {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = searchParams.get("view");
  const view: RankingView =
    raw === "tiers" ? "tiers" : raw === "list" ? "list" : initial;

  const setView = useCallback(
    (next: RankingView) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "list") {
        params.delete("view");
      } else {
        params.set("view", next);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { view, setView };
}

const OPTIONS: { value: RankingView; label: string }[] = [
  { value: "list", label: "List" },
  { value: "tiers", label: "Tiers" },
];

export function RankingViewToggle({
  view,
  onChange,
}: {
  view: RankingView;
  onChange: (view: RankingView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Ranking view"
      className="inline-flex rounded-full border border-line bg-surface p-0.5 text-sm"
    >
      {OPTIONS.map((option) => {
        const selected = view === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              selected
                ? "bg-accent text-on-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
