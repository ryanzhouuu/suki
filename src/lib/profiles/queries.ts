import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import type { LibraryEntry } from "../library/queries";
import { computeProfileStats } from "./stats";

export type RankedSeriesRow = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

export async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();

  return data;
}

async function getRecentComparisonCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("pairwise_series_comparisons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("winner_series_id", "is", null);

  return count ?? 0;
}

export async function getPublicProfileData(
  username: string,
  options?: { viewerId?: string | null },
) {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  const supabase = await createClient();
  const isOwnProfile = options?.viewerId === profile.user_id;

  const [entriesResult, rankingsResult, comparisonCount] = await Promise.all([
    supabase
      .from("user_anime_entries")
      .select("*, anime(*)")
      .eq("user_id", profile.user_id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("derived_series_rankings")
      .select("*, series(*)")
      .eq("user_id", profile.user_id)
      .eq("algorithm_version", RANKING_ALGORITHM_VERSION)
      .order("rank", { ascending: true }),
    isOwnProfile ? getRecentComparisonCount(profile.user_id) : Promise.resolve(null),
  ]);

  const entries = (entriesResult.data ?? []) as LibraryEntry[];
  const rankings = (rankingsResult.data ?? []) as RankedSeriesRow[];
  const topRankings = rankings.slice(0, 10);
  const profileStats = computeProfileStats(entries, rankings, comparisonCount);

  return {
    profile,
    entries,
    rankings: topRankings,
    allRankings: rankings,
    stats: profileStats,
  };
}
