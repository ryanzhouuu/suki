import { createClient } from "@/lib/supabase/server";
import type { AnimeEntryStatus } from "@/lib/constants";
import type { Tables } from "@/types/database";

export type LibraryEntry = Tables<"user_anime_entries"> & {
  anime: Tables<"anime">;
};

export async function getUserLibraryEntries(
  userId: string,
  status?: AnimeEntryStatus,
): Promise<LibraryEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("user_anime_entries")
    .select("*, anime(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LibraryEntry[];
}

export async function getUserEntryForAnime(
  userId: string,
  animeId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_anime_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("anime_id", animeId)
    .maybeSingle();

  return data;
}
