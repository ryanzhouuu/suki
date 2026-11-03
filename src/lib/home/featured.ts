/**
 * Home-hero selection and film-credit copy. Callers freeze the result for a
 * visit so a progress refresh cannot jump the featured show.
 */
import { stripHtml } from "@/lib/anilist/display";
import { getSortedStudios } from "@/lib/anime/detail-helpers";
import type { LibraryEntry } from "@/lib/library/queries";
import type { Json } from "@/types/database";

/** Most shows the home hero offers (the featured show plus "Also tracking"). */
export const MAX_HERO_SHOWS = 5;

/** One in-progress show, flattened for the home hero. */
export type HeroShow = {
  entryId: string;
  anilistId: number;
  title: string;
  bannerUrl: string;
  description: string;
  progressEpisodes: number;
  totalEpisodes: number | null;
  studio: string | null;
  seasonYear: number | null;
};

/** One segment of a film-credit line. `strong` is full white, `accent` vermilion. */
export type CreditPart = { text: string; tone?: "accent" | "strong" };

export function getMainStudioName(studios: Json | null): string | null {
  return getSortedStudios(studios).find((edge) => edge.node?.name)?.node?.name ?? null;
}

const TEXT_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
};

/** Plain synopsis: tags become breaks, and AniList's leftover entities are decoded. */
export function cleanDescription(raw: string | null): string {
  if (!raw) return "";
  const withBreaks = raw.replace(/<br\s*\/?>/gi, " ").replace(/<\/p>/gi, " ");
  const decoded = stripHtml(withBreaks).replace(
    /&(#39|amp|lt|gt|quot|apos|nbsp);/g,
    (entity) => TEXT_ENTITIES[entity.slice(1, -1)] ?? entity,
  );
  return decoded.replace(/\s+/g, " ").trim();
}

function toHeroShow(entry: LibraryEntry): HeroShow | null {
  const anime = entry.anime;
  if (!anime?.banner_image_url) return null;
  return {
    entryId: entry.id,
    anilistId: anime.anilist_id,
    title: anime.english_title || anime.romaji_title || anime.native_title || "Unknown",
    bannerUrl: anime.banner_image_url,
    description: cleanDescription(anime.description),
    progressEpisodes: entry.progress_episodes,
    totalEpisodes: anime.episodes,
    studio: getMainStudioName(anime.studios),
    seasonYear: anime.season_year,
  };
}

/**
 * In-progress shows eligible for the hero: those with banner art, in the order
 * given (most recently updated first). Shows without a banner are skipped so the
 * hero never renders empty artwork.
 */
export function selectHeroShows(
  watching: LibraryEntry[],
  limit = MAX_HERO_SHOWS,
): HeroShow[] {
  const shows: HeroShow[] = [];
  for (const entry of watching) {
    const show = toHeroShow(entry);
    if (show) shows.push(show);
    if (shows.length >= limit) break;
  }
  return shows;
}

/**
 * Keeps the hero's switcher in the order it had at page load. Shows still
 * present keep their original slot (with fresh progress); new ones append.
 */
export function orderHeroShows(frozenIds: string[], current: HeroShow[]): HeroShow[] {
  const byId = new Map(current.map((show) => [show.entryId, show]));
  const ordered: HeroShow[] = [];
  for (const id of frozenIds) {
    const show = byId.get(id);
    if (show) {
      ordered.push(show);
      byId.delete(id);
    }
  }
  return [...ordered, ...byId.values()];
}

/**
 * The show the hero should display: the user's current pick if it is still in
 * progress, otherwise the most recently updated in-progress show.
 */
export function resolveActiveShow(
  activeId: string | null,
  current: HeroShow[],
): HeroShow | null {
  return current.find((show) => show.entryId === activeId) ?? current[0] ?? null;
}

export function formatEpisodeCredit(progress: number, total: number | null): string {
  return total && total > 0 ? `Ep. ${progress} / ${total}` : `Ep. ${progress}`;
}

export function remainingEpisodes(progress: number, total: number | null): number | null {
  if (!total || total <= 0) return null;
  return Math.max(0, total - progress);
}

/** `TRACKING · EP. 14 / 28 · MADHOUSE · 2023`, omitting missing parts. */
export function trackingCredit(show: HeroShow): CreditPart[] {
  const parts: CreditPart[] = [
    { text: "Tracking", tone: "accent" },
    { text: formatEpisodeCredit(show.progressEpisodes, show.totalEpisodes), tone: "strong" },
  ];
  if (show.studio) parts.push({ text: show.studio });
  if (show.seasonYear) parts.push({ text: String(show.seasonYear) });
  return parts;
}

/** `COMPLETED · 28 EPISODES` once the final episode is logged from the hero. */
export function completedCredit(show: HeroShow): CreditPart[] {
  const total = show.totalEpisodes ?? show.progressEpisodes;
  return [
    { text: "Completed", tone: "accent" },
    { text: `${total} ${total === 1 ? "episode" : "episodes"}`, tone: "strong" },
  ];
}

/** `{TITLE} · {studio} · {year}` for a trending caption. */
export function titleCredit(item: {
  title: string;
  studio?: string | null;
  seasonYear: number | null;
}): CreditPart[] {
  const parts: CreditPart[] = [{ text: item.title, tone: "strong" }];
  if (item.studio) parts.push({ text: item.studio });
  if (item.seasonYear) parts.push({ text: String(item.seasonYear) });
  return parts;
}
