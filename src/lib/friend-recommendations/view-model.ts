import type { AnimeEntryStatus } from "@/lib/constants";

/** Max length of the optional personal note attached to a recommendation. */
export const FRIEND_REC_NOTE_MAX = 280;

export type NoteValidation =
  | { ok: true; note: string | null }
  | { ok: false; error: string };

/** Trim a note, treat blank as none, and reject anything over the cap. */
export function validateRecommendationNote(
  raw: string | null | undefined,
): NoteValidation {
  if (raw == null) return { ok: true, note: null };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, note: null };
  if (trimmed.length > FRIEND_REC_NOTE_MAX) {
    return {
      ok: false,
      error: `Note must be ${FRIEND_REC_NOTE_MAX} characters or fewer.`,
    };
  }
  return { ok: true, note: trimmed };
}

export type RecommendationResponse = "add" | "dismiss";

/** A recommendation can only be acted on while it is still pending. */
export function canRespondToRecommendation(status: string): boolean {
  return status === "pending";
}

/** The terminal status a recipient's response transitions a pending rec into. */
export function statusForResponse(
  response: RecommendationResponse,
): "added" | "dismissed" {
  return response === "add" ? "added" : "dismissed";
}

/** Human-readable hint shown to the sender when the friend already logged the title. */
export function describeRecipientLibraryStatus(
  status: AnimeEntryStatus | null,
): string | null {
  switch (status) {
    case "completed":
      return "They've already completed this.";
    case "watching":
      return "They're already watching this.";
    case "plan_to_watch":
      return "It's already on their plan-to-watch.";
    case "paused":
      return "They started this but have it paused.";
    case "dropped":
      return "They started this but dropped it.";
    default:
      return null;
  }
}

export type SenderRef = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type RecommendedAnimeRef = {
  id: string;
  anilist_id: number;
  romaji_title: string;
  english_title: string | null;
  cover_image_url: string | null;
  format: string | null;
  episodes: number | null;
};

export type ReceivedRecommendationRow = {
  id: string;
  note: string | null;
  created_at: string;
  sender_id: string;
  anime: RecommendedAnimeRef | null;
};

export type ReceivedRecommendation = {
  id: string;
  note: string | null;
  createdAt: string;
  sender: SenderRef;
  anime: RecommendedAnimeRef;
  alreadyInLibrary: boolean;
};

/**
 * Pure assembly of the inbox view model: drops rows missing their anime or
 * sender profile, and flags titles the recipient already has in their library.
 */
export function buildReceivedRecommendations(
  rows: ReceivedRecommendationRow[],
  senders: Map<string, SenderRef>,
  ownedAnimeIds: Set<string>,
): ReceivedRecommendation[] {
  const result: ReceivedRecommendation[] = [];
  for (const row of rows) {
    if (!row.anime) continue;
    const sender = senders.get(row.sender_id);
    if (!sender) continue;
    result.push({
      id: row.id,
      note: row.note,
      createdAt: row.created_at,
      sender,
      anime: row.anime,
      alreadyInLibrary: ownedAnimeIds.has(row.anime.id),
    });
  }
  return result;
}
