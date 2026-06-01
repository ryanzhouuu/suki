import Link from "next/link";
import { Suspense } from "react";

import { RankingPanel } from "@/components/ranking/ranking-panel";
import { requireProfile } from "@/lib/auth/session";
import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { getNextComparisonPair } from "@/lib/ranking/prompt";
import { getGenresBySeriesIds } from "@/lib/series/genres";
import { getCompletedSeriesForUser } from "@/lib/series/queries";
import { createClient } from "@/lib/supabase/server";

export default async function RankingPage() {
  const { user } = await requireProfile();
  const supabase = await createClient();

  const completedSeries = await getCompletedSeriesForUser(user.id);

  const [pair, rankingsResult] = await Promise.all([
    getNextComparisonPair(user.id),
    supabase
      .from("derived_series_rankings")
      .select("*, series(*)")
      .eq("user_id", user.id)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
      .order("rank", { ascending: true }),
  ]);

  const rankings = rankingsResult.data ?? [];
  const completedSeriesCount = completedSeries.length;
  const rankingsError = rankingsResult.error?.message;

  const seriesIds = [
    ...new Set([
      ...rankings.map((r) => r.series_id),
      ...completedSeries.map((s) => s.id),
    ]),
  ];
  const genresMap = await getGenresBySeriesIds(seriesIds);
  const genresBySeriesId = Object.fromEntries(genresMap);

  return (
    <div className="space-y-12 pb-24 sm:pb-10">
      <div>
        <p className="eyebrow">Express your taste</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Ranking</h1>
        <p className="mt-2 max-w-md text-muted">
          Rank whole series — not individual seasons. Compare franchises you have
          finished and build a list you actually trust.
        </p>
      </div>

      {rankingsError ? (
        <p className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load rankings: {rankingsError}
        </p>
      ) : null}

      {completedSeriesCount < 2 ? (
        <p className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">
          Mark anime as completed in at least two different series to start
          comparing. If you already have completed anime, refresh this page — we
          link seasons into series automatically.{" "}
          <Link
            href="/library?status=completed"
            className="font-semibold text-accent hover:underline"
          >
            View completed
          </Link>
        </p>
      ) : null}

      <Suspense fallback={null}>
        <RankingPanel
          key={`${pair?.left.id ?? "none"}:${pair?.right.id ?? "none"}`}
          initialPair={pair}
          rankings={rankings}
          genresBySeriesId={genresBySeriesId}
          completedSeriesCount={completedSeriesCount}
        />
      </Suspense>
    </div>
  );
}
