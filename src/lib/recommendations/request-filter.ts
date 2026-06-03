import type { Tables } from "@/types/database";

import { matchesAnyGenre } from "@/lib/filters/genre";

import type { LengthBucket, RecommendationRequestPrefs } from "./request-prefs";
import { isEmptyRequestPrefs } from "./request-prefs";

type AnimeLike = Pick<Tables<"anime">, "genres" | "format" | "episodes">;

export function matchesLengthBucket(
  anime: AnimeLike,
  bucket: LengthBucket,
): boolean {
  const format = anime.format ?? "";
  const episodes = anime.episodes;

  switch (bucket) {
    case "movie":
      return format === "MOVIE";
    case "short":
      if (format === "MOVIE") return false;
      if (format === "TV_SHORT") return true;
      return episodes !== null && episodes <= 12;
    case "cour":
      if (format === "MOVIE") return false;
      if (episodes === null) {
        return format === "TV" || format === "OVA" || format === "ONA";
      }
      return episodes >= 13 && episodes <= 26;
    case "long":
      if (format === "MOVIE") return false;
      return episodes !== null && episodes > 26;
    default:
      return false;
  }
}

export function matchesRequestPrefs(
  anime: AnimeLike,
  prefs: RecommendationRequestPrefs,
): boolean {
  if (isEmptyRequestPrefs(prefs)) return true;

  if (
    prefs.genres.length > 0 &&
    !matchesAnyGenre(anime.genres, prefs.genres)
  ) {
    return false;
  }

  if (prefs.format && anime.format !== prefs.format) {
    return false;
  }

  if (prefs.lengthBucket && !matchesLengthBucket(anime, prefs.lengthBucket)) {
    return false;
  }

  return true;
}

export function filterCandidatesByRequest<T extends AnimeLike>(
  candidates: T[],
  prefs: RecommendationRequestPrefs,
): T[] {
  if (isEmptyRequestPrefs(prefs)) return candidates;
  return candidates.filter((c) => matchesRequestPrefs(c, prefs));
}
