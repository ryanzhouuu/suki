"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/auth/session";
import { syncAnimeFromAnilist } from "@/lib/anime/sync";
import type { AnimeEntryStatus } from "@/lib/constants";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import { recomputeUserRanking } from "@/lib/ranking/recompute";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

export type LibraryActionState = {
  error?: string;
  message?: string;
};

function revalidateLibraryPaths() {
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/search");
  revalidatePath("/ranking");
}

export async function addAnimeEntry(
  anilistId: number,
  status: AnimeEntryStatus,
): Promise<LibraryActionState> {
  const user = await requireAuthUser();

  try {
    const anime = await syncAnimeFromAnilist(anilistId);
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("user_anime_entries")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("anime_id", anime.id)
      .maybeSingle();

    const completedAt =
      status === "completed" ? new Date().toISOString().slice(0, 10) : null;
    const startedAt =
      status === "watching" ? new Date().toISOString().slice(0, 10) : null;

    if (existing) {
      const { error } = await supabase
        .from("user_anime_entries")
        .update({
          status,
          completed_at: completedAt,
          started_at: startedAt ?? undefined,
        })
        .eq("id", existing.id);

      if (error) return { error: error.message };

      await logUserEvent(user.id, USER_EVENT_TYPES.statusChanged, {
        animeId: anime.id,
        metadata: { from: existing.status, to: status },
      });

      if (status === "completed") {
        await logUserEvent(user.id, USER_EVENT_TYPES.animeCompleted, {
          animeId: anime.id,
        });
        try {
          await recomputeUserRanking(user.id);
        } catch {
          // Secret key may be unset during local dev
        }
      }

      revalidateLibraryPaths();
      revalidatePath(`/anime/${anilistId}`);
      return { message: "Already in your library. Status updated." };
    }

    const { error } = await supabase.from("user_anime_entries").insert({
      user_id: user.id,
      anime_id: anime.id,
      status,
      completed_at: completedAt,
      started_at: startedAt,
    });

    if (error) return { error: error.message };

    await logUserEvent(user.id, USER_EVENT_TYPES.animeAdded, {
      animeId: anime.id,
      metadata: { status },
    });

    if (status === "completed") {
      await logUserEvent(user.id, USER_EVENT_TYPES.animeCompleted, {
        animeId: anime.id,
      });
      try {
        await recomputeUserRanking(user.id);
      } catch {
        // ranking optional without secret key
      }
    }

    revalidateLibraryPaths();
    revalidatePath(`/anime/${anilistId}`);
    return { message: "Added to your library." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to add anime",
    };
  }
}

export async function updateAnimeEntry(
  entryId: string,
  patch: {
    status?: AnimeEntryStatus;
    progressEpisodes?: number;
    notes?: string | null;
    priority?: "low" | "medium" | "high" | null;
  },
): Promise<LibraryActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_anime_entries")
    .select("*, anime(anilist_id)")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Entry not found." };
  }

  const updates: TablesUpdate<"user_anime_entries"> = {};
  if (patch.status !== undefined) {
    updates.status = patch.status;
    if (patch.status === "completed") {
      updates.completed_at = new Date().toISOString().slice(0, 10);
    }
    if (patch.status === "watching" && !existing.started_at) {
      updates.started_at = new Date().toISOString().slice(0, 10);
    }
  }
  if (patch.progressEpisodes !== undefined) {
    updates.progress_episodes = Math.max(0, patch.progressEpisodes);
  }
  if (patch.notes !== undefined) updates.notes = patch.notes;
  if (patch.priority !== undefined) updates.priority = patch.priority;

  const { error } = await supabase
    .from("user_anime_entries")
    .update(updates)
    .eq("id", entryId);

  if (error) return { error: error.message };

  if (patch.status && patch.status !== existing.status) {
    await logUserEvent(user.id, USER_EVENT_TYPES.statusChanged, {
      animeId: existing.anime_id,
      metadata: { from: existing.status, to: patch.status },
    });
    if (patch.status === "completed") {
      await logUserEvent(user.id, USER_EVENT_TYPES.animeCompleted, {
        animeId: existing.anime_id,
      });
      try {
        await recomputeUserRanking(user.id);
      } catch {
        /* optional */
      }
    }
  }

  if (patch.progressEpisodes !== undefined) {
    await logUserEvent(user.id, USER_EVENT_TYPES.progressUpdated, {
      animeId: existing.anime_id,
      metadata: { progress: patch.progressEpisodes },
    });
  }

  revalidateLibraryPaths();
  const anilistId = (existing.anime as { anilist_id: number } | null)?.anilist_id;
  if (anilistId) revalidatePath(`/anime/${anilistId}`);

  return { message: "Updated." };
}

export async function removeAnimeEntry(entryId: string): Promise<LibraryActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_anime_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  try {
    await recomputeUserRanking(user.id);
  } catch {
    /* optional */
  }

  revalidateLibraryPaths();
  return { message: "Removed from library." };
}
