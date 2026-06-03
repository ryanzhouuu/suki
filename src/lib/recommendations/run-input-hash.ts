import { hashText } from "./hash";
import {
  serializeRequestPrefs,
  type RecommendationRequestPrefs,
} from "./request-prefs";

export function buildRunInputHash(
  tasteInputHash: string,
  prefs: RecommendationRequestPrefs,
): string {
  return hashText(
    JSON.stringify({
      tasteInputHash,
      requestPrefs: serializeRequestPrefs(prefs),
    }),
  );
}
