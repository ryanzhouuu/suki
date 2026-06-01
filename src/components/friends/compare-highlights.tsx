import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { TasteCompareHighlights } from "@/lib/friends/taste-similarity";

type CompareHighlightsProps = {
  highlights: TasteCompareHighlights;
  viewerLabel: string;
  friendLabel: string;
};

function HighlightList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: TasteCompareHighlights["sharedFavorites"];
  emptyMessage: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.seriesId}
              className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
            >
              <AnimePoster
                src={item.coverImageUrl}
                alt={item.title}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{item.title}</p>
                <p className="text-xs text-muted">
                  Rank #{item.viewerRank} vs #{item.friendRank}
                  {item.rankDelta > 0 ? ` · Δ${item.rankDelta}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CompareHighlights({
  highlights,
  viewerLabel,
  friendLabel,
}: CompareHighlightsProps) {
  return (
    <div className="space-y-10">
      <p className="text-sm text-muted">
        {highlights.sharedCompletedSeriesCount} completed franchise
        {highlights.sharedCompletedSeriesCount === 1 ? "" : "s"} in common
        between {viewerLabel} and {friendLabel}.
      </p>

      <HighlightList
        title="Aligned favorites"
        items={highlights.sharedFavorites}
        emptyMessage="Rank more series in common to see aligned favorites."
      />

      <HighlightList
        title="Biggest disagreements"
        items={highlights.biggestDisagreements}
        emptyMessage="No ranked overlap yet — keep comparing series you both finished."
      />

      <p className="text-sm text-muted">
        View full rankings on{" "}
        <Link href="/ranking" className="font-medium text-accent hover:underline">
          your ranking page
        </Link>{" "}
        and your friend&apos;s profile.
      </p>
    </div>
  );
}
