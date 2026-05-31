import type { AniListMediaTitle } from "./types";

export function getAniListDisplayTitle(title: AniListMediaTitle): string {
  return title.english || title.romaji || title.native || "Unknown";
}

export function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}
