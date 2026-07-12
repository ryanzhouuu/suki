import { cache } from "react";

import { USER_EVENT_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/** Anime the user marked as not interested on recommendations. */
export const getDismissedAnimeIds = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_events")
    .select("anime_id")
    .eq("user_id", userId)
    .eq("event_type", USER_EVENT_TYPES.recommendationDismissed)
    .not("anime_id", "is", null);

  if (error) {
    throw error;
  }

  return [...new Set((data ?? []).map((row) => row.anime_id as string))];
});
