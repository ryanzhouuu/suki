import "server-only";

import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { escapeIlikePattern } from "@/lib/db/ilike";
import type { LibraryEntry } from "@/lib/library/queries";
import { computeProfileStats } from "@/lib/profiles/stats";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ProfileRanking = Tables<"derived_series_rankings"> & {
  series: Tables<"series"> | null;
};

export async function loadBaseProfile(username: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", escapeIlikePattern(username))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadProfileMetadataVisibility(username: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("profile_visibility")
    .ilike("username", escapeIlikePattern(username))
    .maybeSingle();
  if (error) throw error;
  return data?.profile_visibility ?? null;
}

export async function loadFriendship(viewerId: string, otherUserId: string) {
  const supabase = await createClient();
  const first = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", viewerId)
    .eq("recipient_id", otherUserId)
    .in("status", ["pending", "accepted", "blocked", "declined"])
    .maybeSingle();
  if (first.error) throw first.error;
  if (first.data) return first.data;

  const second = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", otherUserId)
    .eq("recipient_id", viewerId)
    .in("status", ["pending", "accepted", "blocked", "declined"])
    .maybeSingle();
  if (second.error) throw second.error;
  return second.data;
}

export async function loadPublicProfileData(
  profile: Tables<"profiles">,
  viewerId: string | null,
) {
  const supabase = await createClient();
  const comparisonPromise =
    viewerId === profile.user_id
      ? supabase
          .from("pairwise_series_comparisons")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.user_id)
          .not("winner_series_id", "is", null)
      : Promise.resolve({ count: null, error: null });

  const [entriesResult, rankingsResult, comparisonResult] = await Promise.all([
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
    comparisonPromise,
  ]);
  if (entriesResult.error) throw entriesResult.error;
  if (rankingsResult.error) throw rankingsResult.error;
  if (comparisonResult.error) throw comparisonResult.error;

  const entries = (entriesResult.data ?? []) as LibraryEntry[];
  const rankings = (rankingsResult.data ?? []) as ProfileRanking[];
  return {
    profile,
    entries,
    allRankings: rankings,
    stats: computeProfileStats(entries, rankings, comparisonResult.count),
  };
}

export async function loadGenresBySeriesIds(seriesIds: string[]) {
  const result = new Map<string, string[]>();
  if (seriesIds.length === 0) return result;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anime_series_map")
    .select("series_id, anime(genres)")
    .in("series_id", seriesIds);
  if (error) throw error;
  for (const row of data ?? []) {
    const anime = row.anime as { genres: string[] } | null;
    if (!anime?.genres?.length) continue;
    result.set(row.series_id, [
      ...new Set([...(result.get(row.series_id) ?? []), ...anime.genres]),
    ]);
  }
  return result;
}
