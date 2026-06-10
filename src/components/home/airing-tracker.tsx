import Link from "next/link";

import { AiringRowItem } from "@/components/home/airing-row";
import { getAiringForWatching } from "@/lib/anime/airing-fetch";

export async function AiringTracker({ userId }: { userId: string }) {
  const rows = await getAiringForWatching(userId).catch(() => []);

  return (
    <section className="animate-rise">
      <div className="mb-4">
        <p className="eyebrow">Now airing</p>
        <h2 className="mt-1 text-2xl font-semibold">Airing this week</h2>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface/40 p-8 text-center">
          <p className="text-sm text-muted">
            Nothing you&apos;re watching is currently airing —{" "}
            <Link
              href="/search"
              className="font-semibold text-accent hover:underline"
            >
              browse this season
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <AiringRowItem key={row.entryId} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function AiringTrackerSkeleton() {
  return (
    <section className="animate-rise">
      <div className="mb-4">
        <p className="eyebrow">Now airing</p>
        <h2 className="mt-1 text-2xl font-semibold">Airing this week</h2>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <li
            key={i}
            className="h-[88px] animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </ul>
    </section>
  );
}
