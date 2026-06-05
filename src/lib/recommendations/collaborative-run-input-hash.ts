import { hashText } from "./hash";
import type { CollaborativeRecommendationPrefs } from "./collaborative-types";
import { serializeRequestPrefs } from "./request-prefs";

export function buildCollaborativeRunInputHash(
  viewerTasteHash: string,
  friendTasteHash: string,
  friendUserId: string,
  prefs: CollaborativeRecommendationPrefs,
): string {
  return hashText(
    JSON.stringify({
      viewerTasteHash,
      friendTasteHash,
      friendUserId,
      mode: prefs.mode,
      requestPrefs: serializeRequestPrefs(prefs),
    }),
  );
}
