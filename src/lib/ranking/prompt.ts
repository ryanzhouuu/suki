import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import { pairKey } from "./canonical-pair";

export type ComparisonPair = {
  left: Tables<"anime">;
  right: Tables<"anime">;
};

export async function getNextComparisonPair(
  userId: string,
): Promise<ComparisonPair | null> {
  const supabase = await createClient();

  const { data: completed } = await supabase
    .from("user_anime_entries")
    .select("anime_id, anime(*)")
    .eq("user_id", userId)
    .eq("status", "completed");

  const animeList = (completed ?? [])
    .map((row) => row.anime)
    .filter((a): a is Tables<"anime"> => a !== null);

  if (animeList.length < 2) return null;

  const { data: comparisons } = await supabase
    .from("pairwise_comparisons")
    .select("left_anime_id, right_anime_id")
    .eq("user_id", userId);

  const seenPairs = new Set(
    (comparisons ?? []).map((c) =>
      pairKey(c.left_anime_id, c.right_anime_id),
    ),
  );

  const { data: rankings } = await supabase
    .from("derived_rankings")
    .select("anime_id, score, comparison_count")
    .eq("user_id", userId);

  const scoreMap = new Map(
    (rankings ?? []).map((r) => [
      r.anime_id,
      { score: Number(r.score), count: r.comparison_count },
    ]),
  );

  let bestPair: ComparisonPair | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < animeList.length; i++) {
    for (let j = i + 1; j < animeList.length; j++) {
      const left = animeList[i];
      const right = animeList[j];
      if (seenPairs.has(pairKey(left.id, right.id))) continue;

      const leftMeta = scoreMap.get(left.id) ?? { score: 1500, count: 0 };
      const rightMeta = scoreMap.get(right.id) ?? { score: 1500, count: 0 };
      const scoreDiff = Math.abs(leftMeta.score - rightMeta.score);
      const lowComparisonBonus = (10 - leftMeta.count) + (10 - rightMeta.count);
      const pairScore = lowComparisonBonus * 10 - scoreDiff;

      if (pairScore > bestScore) {
        bestScore = pairScore;
        bestPair = { left, right };
      }
    }
  }

  return bestPair;
}
