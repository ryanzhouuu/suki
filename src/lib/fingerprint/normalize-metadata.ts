import type { FingerprintEntry } from "./types";

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function cleanLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ").toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

export function displayTitle(entry: FingerprintEntry): string {
  const titles = [
    entry.anime.english_title,
    entry.anime.romaji_title,
    entry.anime.native_title,
  ];
  for (const title of titles) {
    if (typeof title === "string" && title.trim()) return title.trim();
  }
  return "Untitled anime";
}

export function safeTagNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const names = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const tag = item as Record<string, unknown>;
    if (
      typeof tag.isAdult !== "boolean" ||
      typeof tag.isGeneralSpoiler !== "boolean" ||
      typeof tag.isMediaSpoiler !== "boolean"
    ) {
      continue;
    }
    if (tag.isAdult || tag.isGeneralSpoiler || tag.isMediaSpoiler) continue;
    const name = cleanLabel(tag.name);
    if (name) names.add(name);
  }
  return [...names].sort(compareStrings);
}

export function safeGenreNames(genres: unknown): string[] {
  if (!Array.isArray(genres)) return [];
  const names = new Set<string>();
  for (const genre of genres) {
    const name = cleanLabel(genre);
    if (name) names.add(name);
  }
  return [...names].sort(compareStrings);
}

export function safeFormat(value: unknown): string | null {
  const format = cleanLabel(value);
  return format ? format.toUpperCase() : null;
}

export function safeNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export function safePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

export function safePersonalScore(value: unknown): number | null {
  const score =
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : null;
  return score !== null && score <= 10 ? score : null;
}
