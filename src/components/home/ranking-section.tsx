import { AsyncSectionUnavailable } from "@/components/ui/async-section";
import { RankingLocked, RankingMatchup } from "@/components/home/ranking-matchup";
import { runResilientOperation } from "@/lib/resilience";
import { getNextComparisonPair } from "@/lib/ranking/prompt";
import { getCompletedSeriesForUser, getSeriesBanners } from "@/lib/series/queries";

/** Tonight's matchup, or the locked prompt until two series are complete. */
export async function RankingSection({ userId }: { userId: string }) {
  const result = await runResilientOperation(
    {
      route: "/home",
      operation: "load_ranking_prompt",
      dependency: "supabase",
      userId,
    },
    async () => {
      const [completedSeries, pair] = await Promise.all([
        getCompletedSeriesForUser(userId),
        getNextComparisonPair(userId),
      ]);
      return { completedSeries, pair };
    },
  );

  if (result.status === "unavailable") {
    return (
      <AsyncSectionUnavailable
        title="Your ranking prompt is temporarily unavailable"
        description={result.failure.safeMessage}
        referenceId={result.failure.correlationId.slice(0, 8)}
        retryable={result.failure.retryable}
      />
    );
  }

  const { completedSeries, pair } = result.data;
  if (pair && completedSeries.length >= 2) {
    let banners = new Map<string, string | null>();
    try {
      banners = await getSeriesBanners([pair.left, pair.right]);
    } catch {
      banners = new Map();
    }
    return (
      <RankingMatchup
        left={{
          title: pair.left.canonical_title,
          imageUrl: banners.get(pair.left.id) ?? pair.left.cover_image_url,
        }}
        right={{
          title: pair.right.canonical_title,
          imageUrl: banners.get(pair.right.id) ?? pair.right.cover_image_url,
        }}
      />
    );
  }

  if (completedSeries.length < 2) return <RankingLocked />;
  return null;
}
