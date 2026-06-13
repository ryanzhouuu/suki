import Link from "next/link";
import { Suspense } from "react";

import { LibraryPanel } from "@/components/library/library-panel";
import { LibraryTabs } from "@/components/library/library-tabs";
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
      className={`rounded-card border px-3 py-2.5 transition-colors ${
        active
          ? "border-accent/45 bg-accent-soft/60"
          : "border-line bg-surface"
      }`}
    >
      <p
        className={`font-display text-2xl leading-none font-semibold tabular-nums ${
          active ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 truncate text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { user } = await requireProfile();
  const { status: statusParam, group: groupParam } = await searchParams;

  const status =
    statusParam && statusParam !== "all"
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

  return (
    <WidePageFrame className="space-y-6">
      <div>
        <p className="eyebrow">Your collection</p>
        <h1 className="mt-1.5 text-3xl font-semibold sm:text-4xl">Library</h1>
      </div>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
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
