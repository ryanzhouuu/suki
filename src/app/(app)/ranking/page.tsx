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
    <div className="space-y-12 pb-24 sm:pb-10">
      <div>
        <p className="eyebrow">Express your taste</p>
        <h1 className="mt-1.5 text-4xl font-semibold">Ranking</h1>
        <p className="mt-2 max-w-md text-muted">
          Build your list by choosing which anime you enjoyed more. No numbers,
          no pressure — just gut calls.
        </p>
      </div>

      {completedCount < 2 ? (
        <p className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">
          Mark at least two anime as completed to start comparing.{" "}
          <Link
            href="/library?status=completed"
            className="font-semibold text-accent hover:underline"
          >
            View completed
          </Link>
        </p>
      ) : pair ? (
        <ComparisonView
          key={`${pair.left.id}:${pair.right.id}`}
          pair={pair}
        />
      ) : (
        <p className="rounded-card border border-dashed border-line-strong p-6 text-sm text-muted">
          No more unique pairs to compare right now. Check your ranking below or
          add more completed anime.
        </p>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Your ranking</h2>
        <RankedList rankings={rankings} />
      </section>
    </div>
  );
}
