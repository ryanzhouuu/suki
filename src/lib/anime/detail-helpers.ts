import type { Json } from "@/types/database";

export type FuzzyDate = { year: number | null; month: number | null; day: number | null };
export type StudioEdge = { isMain: boolean; node: { name: string; siteUrl: string | null } | null };
export type AnimeTag = { name: string; rank: number | null; category: string | null; isGeneralSpoiler: boolean; isMediaSpoiler: boolean; isAdult: boolean };
export type AnimeRanking = { rank: number; type: string; allTime: boolean; context: string };
export type ExternalLink = { site: string; url: string | null; type: string | null; language: string | null; isDisabled: boolean };
export type AnimeTrailer = { id: string | null; site: string | null; thumbnail: string | null };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatFuzzyDate(date: FuzzyDate | null): string | null {
  if (!date) return null;
  const { year, month, day } = date;
  if (!year && !month && !day) return null;
  const parts: string[] = [];
  if (month && month >= 1 && month <= 12) parts.push(MONTH_NAMES[month - 1]);
  if (day) parts.push(String(day));
  if (year) parts.push(String(year));
  return parts.join(" ") || null;
}

export function getFilteredTags(raw: Json | null, limit = 8): AnimeTag[] {
  if (!raw || !Array.isArray(raw)) return [];
  const tags = raw as AnimeTag[];
  return tags
    .filter((t) => !t.isAdult && !t.isGeneralSpoiler && !t.isMediaSpoiler)
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .slice(0, limit);
}

export function getSortedStudios(raw: Json | null): StudioEdge[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const studios = raw as { edges: StudioEdge[] | null };
  const edges = studios.edges ?? [];
  return [...edges].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
}

export function getEnabledLinks(raw: Json | null): ExternalLink[] {
  if (!raw || !Array.isArray(raw)) return [];
  return (raw as ExternalLink[]).filter((l) => !l.isDisabled && l.url);
}

export function getTopRankings(raw: Json | null): AnimeRanking[] {
  if (!raw || !Array.isArray(raw)) return [];
  return (raw as AnimeRanking[]).filter((r) => r.allTime).slice(0, 3);
}

export function getYoutubeTrailer(raw: Json | null): AnimeTrailer | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const t = raw as AnimeTrailer;
  if (t.site !== "youtube" || !t.id) return null;
  return t;
}
