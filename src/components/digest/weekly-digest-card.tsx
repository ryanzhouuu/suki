import Link from "next/link";

import { DigestDismissButton } from "@/components/digest/digest-dismiss-button";
import type { DigestSnapshot } from "@/lib/digest/snapshot";

export function formatDigestWeek(weekStart: string, weekEnd: string) {
  const start = new Date(`${weekStart}T12:00:00Z`);
  const end = new Date(`${weekEnd}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function WeeklyDigestCard({ digest }: { digest: DigestSnapshot }) {
  const weekLabel = formatDigestWeek(digest.week_start, digest.week_end);
  const totals = [
    digest.summary.totals.episodesWatched == null
      ? null
      : `${digest.summary.totals.episodesWatched} episodes`,
    `${digest.summary.totals.titlesStarted} started`,
    `${digest.summary.totals.titlesCompleted} completed`,
    `${digest.summary.totals.comparisons} comparisons`,
  ].filter((value): value is string => value !== null && !value.startsWith("0 "));

  return (
    <aside className="animate-rise overflow-hidden rounded-card border border-accent/30 bg-linear-to-br from-accent-soft via-surface to-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Your week · {weekLabel}</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {digest.summary.quiet
              ? "Ready for what’s next?"
              : "A week worth looking back on"}
          </h2>
          {totals.length > 0 ? (
            <p className="mt-2 text-sm text-muted">
              {totals.slice(0, 3).join(" · ")}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Your next good watch is waiting.
            </p>
          )}
        </div>
        <DigestDismissButton digestId={digest.id} weekLabel={weekLabel} />
      </div>
      <Link
        href="/digest"
        className="mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-strong"
      >
        See your week →
      </Link>
    </aside>
  );
}
