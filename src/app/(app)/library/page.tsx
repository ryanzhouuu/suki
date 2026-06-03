import { Suspense } from "react";

import { LibraryPanel } from "@/components/library/library-panel";
import { LibraryTabs } from "@/components/library/library-tabs";
import { requireProfile } from "@/lib/auth/session";
import type { AnimeEntryStatus } from "@/lib/constants";
import { getUserLibraryEntries } from "@/lib/library/queries";

type LibraryPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { user } = await requireProfile();
  const { status: statusParam } = await searchParams;

  const status =
    statusParam && statusParam !== "all"
      ? (statusParam as AnimeEntryStatus)
      : undefined;

  const entries = await getUserLibraryEntries(user.id, status);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Your collection</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Library</h1>
        <p className="mt-2 text-muted">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} tracked.
        </p>
      </div>

      <Suspense fallback={null}>
        <LibraryTabs />
      </Suspense>

      {entries.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong p-10 text-center">
          <p className="font-display text-xl text-ink">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted">
            Head to{" "}
            <a href="/search" className="font-semibold text-accent hover:underline">
              search
            </a>{" "}
            to start building your list.
          </p>
        </div>
      ) : (
        <Suspense fallback={null}>
          <LibraryPanel entries={entries} />
        </Suspense>
      )}
    </div>
  );
}
