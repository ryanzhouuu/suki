import Link from "next/link";

import { ComparisonView } from "@/components/ranking/comparison-view";
import { RankedList } from "@/components/ranking/ranked-list";
import { requireProfile } from "@/lib/auth/session";
import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { getNextComparisonPair } from "@/lib/ranking/prompt";
import { createClient } from "@/lib/supabase/server";

export default async function RankingPage() {
  const { user } = await requireProfile();
  const supabase = await createClient();

  const [pair, rankingsResult, completedResult] = await Promise.all([
    getNextComparisonPair(user.id),
    supabase
      .from("derived_rankings")
      .select("*, anime(*)")
      .eq("user_id", user.id)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
      .order("rank", { ascending: true }),
    supabase
      .from("user_anime_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed"),
  ]);

  const rankings = rankingsResult.data ?? [];
  const completedCount = completedResult.data?.length ?? 0;

  return (
    <div className="space-y-10 pb-20 sm:pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ranking</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Build your list by choosing which anime you enjoyed more.
        </p>
      </div>

      {completedCount < 2 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Mark at least two anime as completed to start comparing.{" "}
          <Link href="/library?status=completed" className="font-medium underline">
            View completed
          </Link>
        </p>
      ) : pair ? (
        <ComparisonView pair={pair} />
      ) : (
        <p className="text-sm text-zinc-500">
          No more unique pairs to compare right now. Check your ranking below or
          add more completed anime.
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">Your ranking</h2>
        <RankedList rankings={rankings} />
      </section>
    </div>
  );
}
