import Link from "next/link";

import { AnimePoster } from "@/components/anime/anime-poster";
import type { TasteMatchProfile } from "@/lib/friends/taste-similarity";

type CompareHighlightsProps = {
  match: TasteMatchProfile;
  viewerLabel: string;
  friendLabel: string;
  friendUsername: string;
};

function SeriesHighlightList({
  title,
  items = [],
  emptyMessage,
}: {
  title: string;
  items?: TasteMatchProfile["highlights"]["sharedFavorites"];
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

function GenreGrid({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: TasteMatchProfile["sharedGenres"];
  emptyMessage: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.genre} className="rounded-card border border-line bg-surface p-3">
              <p className="font-medium text-ink">{item.genre}</p>
              <p className="mt-1 text-xs text-muted">
                {item.viewerCount} for you · {item.friendCount} for friend
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DifferenceList({
  title,
  rows,
  emptyMessage,
  viewerLabel,
  friendLabel,
}: {
  title: string;
  rows: { label: string; viewerCount: number; friendCount: number; delta: number }[];
  emptyMessage: string;
  viewerLabel: string;
  friendLabel: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const favoredBy = row.delta > 0 ? viewerLabel : friendLabel;
            return (
              <li key={row.label} className="rounded-card border border-line bg-surface p-3">
                <p className="font-medium text-ink">{row.label}</p>
                <p className="mt-1 text-xs text-muted">
                  {viewerLabel}: {row.viewerCount} · {friendLabel}: {row.friendCount}
                </p>
                <p className="mt-1 text-xs text-muted">Leans toward {favoredBy}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DiscoveryList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: TasteMatchProfile["viewerLovedFriendUnwatched"];
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
            <li key={item.animeId} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
              <AnimePoster src={item.coverImageUrl} alt={item.title} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{item.title}</p>
                {item.personalScore != null ? (
                  <p className="text-xs text-muted">Personal score: {item.personalScore}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CompareHighlights({
  match,
  viewerLabel,
  friendLabel,
  friendUsername,
}: CompareHighlightsProps) {
  const formatDiffRows = match.formatDifferences.map((row) => ({
    label: row.format,
    viewerCount: row.viewerCount,
    friendCount: row.friendCount,
    delta: row.delta,
  }));
  const genreDiffRows = match.genreDifferences.map((row) => ({
    label: row.genre,
    viewerCount: row.viewerCount,
    friendCount: row.friendCount,
    delta: row.delta,
  }));

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        {match.highlights.sharedCompletedSeriesCount} completed franchise
        {match.highlights.sharedCompletedSeriesCount === 1 ? "" : "s"} in common
        between {viewerLabel} and {friendLabel}.
      </p>

      <section className="overflow-hidden rounded-card border border-accent/35 bg-linear-to-br from-accent-soft via-surface to-surface p-6 shadow-[0_16px_48px_-28px_rgb(var(--shadow-color)/0.4)] sm:p-7">
        <p className="eyebrow">For both of you</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
          Find something for both of us
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-muted">
          Turn this match profile into collaborative recommendations blending
          your shared and complementary taste.
        </p>
        <Link
          href={`/friends/compare/${friendUsername}/recommendations`}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-strong"
        >
          Open collaborative picks →
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SeriesHighlightList
          title="Aligned favorites"
          items={match.highlights.sharedFavorites}
          emptyMessage="Rank more series in common to see aligned favorites."
        />
        <SeriesHighlightList
          title="Biggest disagreements"
          items={match.highlights.biggestDisagreements}
          emptyMessage="No ranked overlap yet — keep comparing series you both finished."
        />
      </div>

      <GenreGrid
        title="Shared genre strengths"
        items={match.sharedGenres}
        emptyMessage="You need more overlapping completed or in-progress entries to surface shared genres."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DifferenceList
          title="Genre differences"
          rows={genreDiffRows}
          viewerLabel={viewerLabel}
          friendLabel={friendLabel}
          emptyMessage="No strong genre differences yet."
        />
        <DifferenceList
          title="Format differences"
          rows={formatDiffRows}
          viewerLabel={viewerLabel}
          friendLabel={friendLabel}
          emptyMessage="No strong format differences yet."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DiscoveryList
          title={`${friendLabel} might enjoy from your favorites`}
          items={match.viewerLovedFriendUnwatched}
          emptyMessage="Add more highly rated or completed entries to surface picks."
        />
        <DiscoveryList
          title={`You might enjoy from ${friendLabel}'s favorites`}
          items={match.friendLovedViewerUnwatched}
          emptyMessage={`${friendLabel} needs more highly rated or completed entries to surface picks.`}
        />
      </div>

      <section>
        <h2 className="text-xl font-semibold">Shared plan to watch</h2>
        {match.sharedPlanToWatch.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Add more watchlist entries to find overlap.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {match.sharedPlanToWatch.map((item) => (
              <li key={item.animeId} className="rounded-card border border-line bg-surface p-3">
                <p className="font-medium text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-muted">
                  Priority: you ({item.viewerPriority ?? "none"}) · {friendLabel} (
                  {item.friendPriority ?? "none"})
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

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
