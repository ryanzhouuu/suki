import { getAniListDisplayTitle } from "@/lib/anilist/display";
import type { AniListMediaTitle } from "@/lib/anilist/types";

export function stripSeasonSuffix(title: string): string {
  return title
    .replace(/\s+Season\s+\d+.*$/i, "")
    .replace(/\s+Part\s+\d+.*$/i, "")
    .trim();
}

export function displayTitleFromAniList(title: AniListMediaTitle): string {
  return stripSeasonSuffix(getAniListDisplayTitle(title));
}

export function slugifySeriesTitle(title: string, anilistPrimaryId: number): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "series"}-${anilistPrimaryId}`;
}
