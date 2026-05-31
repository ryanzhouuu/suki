import { Suspense } from "react";

import { EntryCard } from "@/components/library/entry-card";
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
    <div className="space-y-6 pb-20 sm:pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      <Suspense fallback={null}>
        <LibraryTabs />
      </Suspense>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No anime here yet. Try{" "}
          <a href="/search" className="font-medium underline">
            search
          </a>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
