"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAuthUser } from "@/lib/auth/session";
import { syncAnimeFromAnilist } from "@/lib/anime/sync";
import type { AnimeEntryStatus } from "@/lib/constants";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";
import {
  changedLibraryFields,
  validateLibraryEntryPatch,
  type LibraryEntryPatchInput,
} from "@/lib/library/validate";
import { recomputeUserRanking } from "@/lib/ranking/recompute-series";
import { ensureAnimeSeriesMapping } from "@/lib/series/resolver";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesUpdate } from "@/types/database";

export type LibraryActionState = {
  error?: string;
  message?: string;
};

function revalidateLibraryPaths(options?: {
  anilistId?: number;
  includeHome?: boolean;
  includeRanking?: boolean;
}) {
  revalidatePath("/library");
  if (options?.anilistId) {
    revalidatePath(`/anime/${options.anilistId}`);
  }
  if (options?.includeHome) {
    revalidatePath("/home");
  }
  if (options?.includeRanking) {
    revalidatePath("/ranking");
  }
}

function scheduleCompletedEntrySideEffects(
  userId: string,
  anime: Tables<"anime">,
) {
  after(async () => {
    try {
      await ensureAnimeSeriesMapping(anime);
      await recomputeUserRanking(userId);
    } catch {
      /* optional without secret key / AniList */
    }
  });
}

function scheduleRankingRecompute(userId: string) {
  after(async () => {
    try {
      await recomputeUserRanking(userId);
    } catch {
      /* optional */
    }
  });
}

function scheduleLibraryRevalidation(options?: {
  anilistId?: number;
  includeHome?: boolean;
  includeRanking?: boolean;
}) {
  after(() => {
    revalidateLibraryPaths(options);
  });
}

function scheduleLogEvent(
  userId: string,
  eventType: string,
  options?: { animeId?: string; metadata?: Json },
) {
  after(() => {
    void logUserEvent(userId, eventType, options);
  });
}

/** Use cached row when present — avoids AniList + series crawl on status changes. */
async function resolveAnimeForLibraryEntry(anilistId: number) {
  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("anime")
    .select("*")
    .eq("anilist_id", anilistId)
    .maybeSingle();

  if (cached) return cached;
  return syncAnimeFromAnilist(anilistId);
}

export async function addAnimeEntry(
  anilistId: number,
  status: AnimeEntryStatus,
): Promise<LibraryActionState> {
  const user = await requireAuthUser();

  try {
    const anime = await resolveAnimeForLibraryEntry(anilistId);
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

      scheduleLogEvent(user.id, USER_EVENT_TYPES.statusChanged, {
        animeId: anime.id,
        metadata: { from: existing.status, to: status },
      });

      if (status === "completed") {
        scheduleLogEvent(user.id, USER_EVENT_TYPES.animeCompleted, {
          animeId: anime.id,
        });
        scheduleCompletedEntrySideEffects(user.id, anime);
      }

      scheduleLibraryRevalidation({
        anilistId,
        includeHome: true,
        includeRanking: status === "completed",
      });
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

    scheduleLogEvent(user.id, USER_EVENT_TYPES.animeAdded, {
      animeId: anime.id,
      metadata: { status },
    });

    if (status === "completed") {
      scheduleLogEvent(user.id, USER_EVENT_TYPES.animeCompleted, {
        animeId: anime.id,
      });
      scheduleCompletedEntrySideEffects(user.id, anime);
    }

    scheduleLibraryRevalidation({
      anilistId,
      includeHome: true,
      includeRanking: status === "completed",
    });
    return { message: "Added to your library." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to add anime",
    };
  }
}

export async function updateAnimeEntry(
  entryId: string,
  patch: LibraryEntryPatchInput,
): Promise<LibraryActionState> {
  const user = await requireAuthUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_anime_entries")
    .select("*, anime(*)")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return { error: "Entry not found." };
  }

  const animeRow = existing.anime as Tables<"anime"> | null;
  const maxEpisodes =
    animeRow && !Array.isArray(animeRow) ? animeRow.episodes : null;

  let validated;
  try {
    validated = validateLibraryEntryPatch(patch, { maxEpisodes });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid library update.",
    };
  }

  const effectiveStatus = validated.status ?? existing.status;
  if (effectiveStatus !== "plan_to_watch" && validated.priority !== undefined) {
    validated.priority = null;
  }

  const updates: TablesUpdate<"user_anime_entries"> = {};

  if (validated.status !== undefined) {
    updates.status = validated.status;
    if (validated.status === "completed" && validated.completedAt === undefined) {
      updates.completed_at = new Date().toISOString().slice(0, 10);
    }
    if (
      validated.status === "watching" &&
      validated.startedAt === undefined &&
      !existing.started_at
    ) {
      updates.started_at = new Date().toISOString().slice(0, 10);
    }
    if (validated.status !== "plan_to_watch") {
      updates.priority = null;
    }
  }

  if (validated.progressEpisodes !== undefined) {
    updates.progress_episodes = validated.progressEpisodes;
  }
  if (validated.notes !== undefined) updates.notes = validated.notes;
  if (validated.priority !== undefined) updates.priority = validated.priority;
  if (validated.personalScore !== undefined) {
    updates.personal_score = validated.personalScore;
  }
  if (validated.startedAt !== undefined) updates.started_at = validated.startedAt;
  if (validated.completedAt !== undefined) {
    updates.completed_at = validated.completedAt;
  }
  if (validated.rewatchCount !== undefined) {
    updates.rewatch_count = validated.rewatchCount;
  }

  const startedAt = updates.started_at ?? existing.started_at;
  const completedAt = updates.completed_at ?? existing.completed_at;
  if (startedAt && completedAt && completedAt < startedAt) {
    return { error: "Completed date cannot be before started date." };
  }

  if (Object.keys(updates).length === 0) {
    return { message: "No changes to save." };
  }

  const { error } = await supabase
    .from("user_anime_entries")
    .update(updates)
    .eq("id", entryId);

  if (error) return { error: error.message };

  const changedFields = changedLibraryFields(existing, validated);
  const richChangedFields = changedFields.filter(
    (field) =>
      !["status", "progress_episodes"].includes(field),
  );

  if (validated.status && validated.status !== existing.status) {
    scheduleLogEvent(user.id, USER_EVENT_TYPES.statusChanged, {
      animeId: existing.anime_id,
      metadata: { from: existing.status, to: validated.status },
    });
    if (validated.status === "completed") {
      scheduleLogEvent(user.id, USER_EVENT_TYPES.animeCompleted, {
        animeId: existing.anime_id,
      });
      if (animeRow && !Array.isArray(animeRow)) {
        scheduleCompletedEntrySideEffects(user.id, animeRow);
      } else {
        const animeId = existing.anime_id;
        after(async () => {
          const { data: animeData } = await supabase
            .from("anime")
            .select("*")
            .eq("id", animeId)
            .single();
          if (animeData) {
            try {
              await ensureAnimeSeriesMapping(animeData);
              await recomputeUserRanking(user.id);
            } catch {
              /* optional */
            }
          }
        });
      }
    }
  }

  if (validated.progressEpisodes !== undefined) {
    scheduleLogEvent(user.id, USER_EVENT_TYPES.progressUpdated, {
      animeId: existing.anime_id,
      metadata: { progress: validated.progressEpisodes },
    });
  }

  if (richChangedFields.length > 0) {
    scheduleLogEvent(user.id, USER_EVENT_TYPES.libraryEntryUpdated, {
      animeId: existing.anime_id,
      metadata: { changedFields: richChangedFields },
    });
  }

  const anilistId = animeRow && !Array.isArray(animeRow) ? animeRow.anilist_id : undefined;
  const statusChanged =
    validated.status !== undefined && validated.status !== existing.status;

  scheduleLibraryRevalidation({
    anilistId,
    includeHome: statusChanged || validated.progressEpisodes !== undefined,
    includeRanking: validated.status === "completed",
  });

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

  scheduleLogEvent(user.id, USER_EVENT_TYPES.libraryEntryRemoved, {
    metadata: { entryId },
  });

  scheduleRankingRecompute(user.id);

  scheduleLibraryRevalidation({ includeHome: true, includeRanking: true });
  return { message: "Removed from library." };
}
