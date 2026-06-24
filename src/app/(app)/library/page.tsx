import Link from "next/link";
import { Suspense } from "react";

import { LibraryPanel } from "@/components/library/library-panel";
import { LibraryTabs } from "@/components/library/library-tabs";
import { WatchlistShuffle } from "@/components/library/watchlist-shuffle";
import { WidePageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import {
  ANIME_ENTRY_STATUSES,
  STATUS_LABELS,
  type AnimeEntryStatus,
} from "@/lib/constants";
import {
  getSeriesRefsByAnimeIds,
  getUserLibraryEntries,
} from "@/lib/library/queries";

type LibraryPageProps = {
  searchParams: Promise<{ status?: string; group?: string }>;
};

function StatCell({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-baseline justify-between gap-2 rounded-lg border px-2.5 py-2 transition-colors sm:block sm:rounded-card sm:px-3 sm:py-2.5 ${
        active
          ? "border-accent/45 bg-accent-soft/60"
          : "border-line bg-surface"
      }`}
    >
      <p
        className={`font-display text-xl leading-none font-semibold tabular-nums sm:text-2xl ${
          active ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted sm:mt-1.5 sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { user } = await requireProfile();
  const { status: statusParam, group: groupParam } = await searchParams;

  // Only accept a real enum value; anything else (incl. "all" or garbage) shows
  // the full library rather than casting an invalid value into the enum query.
  const status =
    statusParam && (ANIME_ENTRY_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as AnimeEntryStatus)
      : undefined;

  const grouped = groupParam === "series";

  // In grouped mode a series card can span statuses, so we always fetch the
  // full library and let the panel filter groups by status (any-match).
  // Otherwise: when a status filter is active we still want full counts for the
  // strip; on the "all" tab the unfiltered fetch already serves both.
  const [entries, allEntries] = await Promise.all([
    getUserLibraryEntries(user.id, grouped ? undefined : status),
    status && !grouped ? getUserLibraryEntries(user.id) : Promise.resolve(null),
  ]);

  const countSource = allEntries ?? entries;
  const counts = countSource.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.status] = (acc[entry.status] ?? 0) + 1;
    return acc;
  }, {});

  const seriesByAnimeId = grouped
    ? Object.fromEntries(
        await getSeriesRefsByAnimeIds(entries.map((entry) => entry.anime.id)),
      )
    : undefined;

  // The shuffle "decision helper" lives on the (ungrouped) plan-to-watch tab,
  // where `entries` is already exactly the plan-to-watch list.
  const showShuffle =
    status === "plan_to_watch" && !grouped && entries.length > 0;

  return (
    <WidePageFrame className="space-y-6">
      <div>
        <p className="eyebrow">Your collection</p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">Library</h1>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:grid-cols-6">
        <StatCell label="Total" value={countSource.length} active={!status} />
        {ANIME_ENTRY_STATUSES.map((s) => (
          <StatCell
            key={s}
            label={STATUS_LABELS[s]}
            value={counts[s] ?? 0}
            active={status === s}
          />
        ))}
      </dl>

      <Suspense fallback={null}>
        <LibraryTabs />
      </Suspense>

      {showShuffle ? <WatchlistShuffle entries={entries} /> : null}

      {entries.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-display text-xl text-ink">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted">
            Import an existing list, or{" "}
            <a href="/search" className="font-semibold text-accent hover:underline">
              search
            </a>{" "}
            to build one from scratch.
          </p>
          <div className="mt-5 flex justify-center">
            <Link href="/import">
              <Button>Import your list</Button>
            </Link>
          </div>
        </div>
      ) : (
        <Suspense fallback={null}>
          <LibraryPanel
            entries={entries}
            status={status}
            seriesByAnimeId={seriesByAnimeId}
          />
        </Suspense>
      )}
    </WidePageFrame>
  );
}
