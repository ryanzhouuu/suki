"use server";

import { requireAuthUser } from "@/lib/auth/session";
import { USER_EVENT_TYPES } from "@/lib/constants";
import { logUserEvent } from "@/lib/events/log";

/**
 * Records a watchlist shuffle for future signal (e.g. "decision helper" usage).
 * Fire-and-forget from the client — never blocks the reveal.
 */
export async function logWatchlistShuffle(input: {
  anilistId?: number | null;
  lengthBucket?: string | null;
  genres?: string[];
}): Promise<void> {
  try {
    const user = await requireAuthUser();
    await logUserEvent(user.id, USER_EVENT_TYPES.watchlistShuffled, {
      metadata: {
        anilistId: input.anilistId ?? null,
        lengthBucket: input.lengthBucket ?? null,
        genres: input.genres ?? [],
      },
    });
  } catch {
    /* logging is best-effort; a failure must not surface to the user */
  }
}
