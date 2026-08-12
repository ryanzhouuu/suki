import { createClient } from "@/lib/supabase/server";

export type DueInactivityPrompt = {
  id: string;
  pausedAt: string;
  anime: {
    anilistId: number;
    title: string;
    coverImageUrl: string | null;
  };
};

type DuePromptRow = {
  id: string;
  paused_at: string | null;
  anime: {
    anilist_id: number;
    romaji_title: string;
    english_title: string | null;
    cover_image_url: string | null;
  } | null;
};

export async function getDueInactivityPrompts(
  userId: string,
  now = new Date(),
): Promise<DueInactivityPrompt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_anime_entries")
    .select(
      "id, paused_at, anime(anilist_id, romaji_title, english_title, cover_image_url)",
    )
    .eq("user_id", userId)
    .eq("status", "paused")
    .lte("drop_prompt_due_at", now.toISOString())
    .order("drop_prompt_due_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as DuePromptRow[]).flatMap((row) => {
    if (!row.anime || !row.paused_at) return [];
    return [
      {
        id: row.id,
        pausedAt: row.paused_at,
        anime: {
          anilistId: row.anime.anilist_id,
          title: row.anime.english_title || row.anime.romaji_title,
          coverImageUrl: row.anime.cover_image_url,
        },
      },
    ];
  });
}
