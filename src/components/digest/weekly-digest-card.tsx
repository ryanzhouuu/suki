import Link from "next/link";

import { DigestDismissButton } from "@/components/digest/digest-dismiss-button";
import {
  isDevelopmentDigestPreview,
  type DigestSnapshot,
} from "@/lib/digest/snapshot";

export function formatDigestWeek(weekStart: string, weekEnd: string) {
  const start = new Date(`${weekStart}T12:00:00Z`);
  const end = new Date(`${weekEnd}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function WeeklyDigestCard({ digest }: { digest: DigestSnapshot }) {
  const weekLabel = formatDigestWeek(digest.week_start, digest.week_end);
  const isPreview = isDevelopmentDigestPreview(digest);
  const totals = [
    digest.summary.totals.episodesWatched == null
      ? null
      : `${digest.summary.totals.episodesWatched} episodes`,
    `${digest.summary.totals.titlesStarted} started`,
    `${digest.summary.totals.titlesCompleted} completed`,
    `${digest.summary.totals.comparisons} comparisons`,
  ].filter((value): value is string => value !== null && !value.startsWith("0 "));

  return (
    <aside className="animate-rise relative overflow-hidden border-y-2 border-ink bg-surface px-5 py-5 shadow-[0_18px_55px_-42px_rgb(var(--shadow-color)/0.55)] sm:px-7 sm:py-6">
      <div
        aria-hidden
        className="absolute top-0 right-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgb(var(--accent)/0.14),transparent_70%)]"
      />
      <div className="relative flex items-start justify-between gap-5 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl leading-none text-accent">
            週
          </span>
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted uppercase">
              The Suki Weekly
            </p>
            <p className="mt-0.5 text-xs text-faint">{weekLabel}</p>
          </div>
        </div>
        {!isPreview ? (
          <DigestDismissButton digestId={digest.id} weekLabel={weekLabel} />
        ) : (
          <span className="rounded-full border border-line px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-muted uppercase">
            Preview
          </span>
        )}
      </div>

      <div className="relative grid gap-5 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className="eyebrow">Week in review</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl leading-[1.05] font-semibold tracking-[-0.025em] text-ink sm:text-4xl">
            {digest.summary.quiet
              ? "Ready for what’s next?"
              : "A week worth looking back on"}
          </h2>
          {totals.length > 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted">
              {totals.slice(0, 3).join(" · ")}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Your next good watch is waiting.
            </p>
          )}
        </div>
        <Link
          href="/digest"
          className="group inline-flex w-fit items-center gap-3 border-b-2 border-accent pb-1 text-sm font-semibold text-ink transition-colors hover:text-accent"
        >
          Read the edition
          <span
            aria-hidden
            className="text-lg transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </aside>
  );
}
