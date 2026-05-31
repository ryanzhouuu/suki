import { RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

import type { LibraryEntry } from "../library/queries";

export async function getProfileByUsername(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();

  return data;
}

export async function getPublicProfileData(username: string) {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  const supabase = await createClient();

  const [entriesResult, rankingsResult] = await Promise.all([
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
      .order("rank", { ascending: true })
      .limit(10),
  ]);

  const entries = (entriesResult.data ?? []) as LibraryEntry[];
  const rankings = rankingsResult.data ?? [];

  const stats = {
    total: entries.length,
    watching: entries.filter((e) => e.status === "watching").length,
    completed: entries.filter((e) => e.status === "completed").length,
    planToWatch: entries.filter((e) => e.status === "plan_to_watch").length,
  };

  return { profile, entries, rankings, stats };
}
