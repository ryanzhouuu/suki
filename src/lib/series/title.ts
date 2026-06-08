import { getAniListDisplayTitle } from "@/lib/anilist/display";
import type { AniListMediaTitle } from "@/lib/anilist/types";

/** Arc / cour suffixes after the main show title (AniList often splits these). */
const FRANCHISE_ARC_TAIL =
  /\s+(?:(?:the\s+)?(?:hashira|entertainment district|swordsmith village|mugen train|infinity castle|final selection|asakusa|yoshiwara)(?:\s+[\w'-]+)*\s+arc|training arc)$/i;

/** Trailing Roman numerals used as season markers (II+, not lone I). */
const ROMAN_SEASON_SUFFIX =
  /\s+(II|III|IV|V|VI|VII|VIII|IX|X{1,3}|XI{0,2}|XII|XIII)$/i;

/** Single-digit season index at end (2–9); keeps "Mob Psycho 100", etc. */
const NUMERIC_SEASON_SUFFIX = /\s+([2-9])$/;

/** Prequel movies titled "Franchise 0" (e.g. Jujutsu Kaisen 0). */
const PREQUEL_ZERO_SUFFIX = /\s+0$/;

const SEASONISH_SUFFIX =
  /\b(season|part|cour)\s*(\d+|[ivxlc]+)\b/i;

const ARC_SUFFIX = /^(the\s+)?[\w\s'-]+\s+arc$/i;
const NON_DISTINGUISHING_COLON_SUFFIX =
  /^(movie|the movie|ova|ona|special|tv special|summary|compilation|recap|episode\s+\d+.*)$/i;

/**
 * Strip season / part / cour markers from display titles.
 */
export function stripSeasonSuffix(title: string): string {
  let t = title.trim();

  t = t.replace(/\s+Season\s+\d+\b.*$/i, "");
  t = t.replace(/\s+\d+(st|nd|rd|th)\s+Season\b.*$/i, "");
  t = t.replace(/\s+(first|second|third|fourth|fifth)\s+season\b.*$/i, "");
  t = t.replace(/\s+(the\s+)?final\s+season\b.*$/i, "");
  t = t.replace(/\s+Season\s+[IVXLC]+\b.*$/i, "");
  t = t.replace(/\s+Part\s+\d+\b.*$/i, "");
  t = t.replace(/\s+Part\s+[IVXLC]+\b.*$/i, "");
  t = t.replace(/\s+Cour\s+\d+\b.*$/i, "");
  t = t.replace(/\s+S\d+\b$/i, "");
  t = t.replace(ROMAN_SEASON_SUFFIX, "");
  t = t.replace(NUMERIC_SEASON_SUFFIX, "");

  return t.trim();
}

function stripColonSubtitle(title: string): string | null {
  const match = title.match(/^([^:]+):\s*(.+)$/);
  if (!match) return null;

  const base = match[1].trim();
  const suffix = match[2].trim();

  if (base.length < 2) return null;
  if (SEASONISH_SUFFIX.test(suffix)) return null;
  if (ARC_SUFFIX.test(suffix)) return null;
  if (!NON_DISTINGUISHING_COLON_SUFFIX.test(suffix)) return null;

  return base;
}

function normalizeFranchiseKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function legacyColonBase(title: string): string | null {
  const colon = title.indexOf(":");
  if (colon <= 0) return null;
  const base = title.slice(0, colon).trim();
  return base.length >= 2 ? base : null;
}

function franchiseMatchKeys(title: string): string[] {
  const root = franchiseRootFromTitle(title);
  const keys = new Set<string>();
  const rootKey = normalizeFranchiseKey(root);
  if (rootKey) keys.add(rootKey);

  // Back-compat for existing rows created by old title cleanup that stripped
  // identity-bearing colon subtitles (e.g. "Kaguya-sama: Love is War").
  const legacyBase = legacyColonBase(root);
  if (legacyBase) {
    const legacyKey = normalizeFranchiseKey(legacyBase);
    if (legacyKey) keys.add(legacyKey);
  }

  return [...keys];
}

/** A cluster member's titles in both languages (romaji is always present). */
export type FranchiseMember = {
  english: string | null;
  romaji: string | null;
};

type ResolvedMember = {
  english: string | null;
  romaji: string | null;
  display: string;
  key: string;
};

/**
 * Shortest root that is a prefix of every other (e.g. "Black Clover" over
 * "Black Clover: Sword of the Wizard King"). Returns null when none qualifies.
 */
function findSharedPrefixRoot(roots: string[]): string | null {
  const unique = [...new Set(roots.map((r) => r.trim()).filter(Boolean))];
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];

  const sorted = [...unique].sort((a, b) => a.length - b.length);
  for (const candidate of sorted) {
    const isSharedPrefix = unique.every(
      (other) =>
        other === candidate ||
        other.startsWith(`${candidate}:`) ||
        other.startsWith(`${candidate} -`),
    );
    if (isSharedPrefix) return candidate;
  }
  return null;
}

/** Within one franchise group, prefer the shortest English root; else romaji. */
function pickGroupDisplay(group: ResolvedMember[]): string {
  const english = group
    .map((e) => e.english)
    .filter((x): x is string => Boolean(x));
  const pool =
    english.length > 0
      ? english
      : group.map((e) => e.romaji).filter((x): x is string => Boolean(x));
  const sorted = [...new Set(pool)].sort((a, b) => a.length - b.length);
  return sorted[0] ?? group[0].display;
}

/**
 * Pick the canonical franchise label from cluster members, choosing the
 * franchise by frequency and the *language* by preference: group members by
 * their romaji identity (always present, stable across seasons) so English and
 * romaji-only seasons of one show vote together, then display the English root
 * whenever any member in the winning group has one.
 */
export function pickConsolidatedFranchiseRootFromMembers(
  members: FranchiseMember[],
): string {
  const entries: ResolvedMember[] = [];
  for (const m of members) {
    const english = m.english?.trim() ? franchiseRootFromTitle(m.english) : null;
    const romaji = m.romaji?.trim() ? franchiseRootFromTitle(m.romaji) : null;
    const display = english ?? romaji;
    if (!display) continue;
    entries.push({
      english,
      romaji,
      display,
      key: normalizeFranchiseKey(romaji ?? english ?? ""),
    });
  }

  if (entries.length === 0) return "";
  if (entries.length === 1) return entries[0].display;

  // 1. Shared-prefix consolidation on the English-preferred display roots.
  const prefix = findSharedPrefixRoot(entries.map((e) => e.display));
  if (prefix) return prefix;

  // 2. Group by romaji identity; pick the most frequent franchise. On a tie,
  //    prefer the shorter (more general) label over a long movie/special title.
  const groups = new Map<string, ResolvedMember[]>();
  for (const e of entries) {
    const list = groups.get(e.key) ?? [];
    list.push(e);
    groups.set(e.key, list);
  }

  let best: { display: string; count: number } | null = null;
  for (const list of groups.values()) {
    const display = pickGroupDisplay(list);
    const count = list.length;
    if (
      !best ||
      count > best.count ||
      (count === best.count && display.length < best.display.length)
    ) {
      best = { display, count };
    }
  }

  return best?.display ?? entries[0].display;
}

/**
 * Consolidate a set of franchise root strings (treated as English display
 * titles). Thin wrapper over {@link pickConsolidatedFranchiseRootFromMembers}.
 */
export function pickConsolidatedFranchiseRoot(candidates: string[]): string {
  return pickConsolidatedFranchiseRootFromMembers(
    candidates.map((c) => ({ english: c, romaji: null })),
  );
}

/**
 * Shared franchise label for grouping seasons, movies, and cours under one series.
 */
export function franchiseRootFromTitle(title: string): string {
  const trimmed = stripSeasonSuffix(title.trim());

  const kimetsu = trimmed.match(
    /^(Demon Slayer(?::| -)?\s*-?\s*Kimetsu no Yaiba)/i,
  );
  if (kimetsu) {
    return "Demon Slayer: Kimetsu no Yaiba";
  }

  const colonBase = stripColonSubtitle(trimmed);
  if (colonBase) {
    return franchiseRootFromTitle(colonBase);
  }

  const withoutArc = trimmed.replace(FRANCHISE_ARC_TAIL, "").trim();
  if (withoutArc.length > 0 && withoutArc.length < trimmed.length) {
    return franchiseRootFromTitle(withoutArc);
  }

  const withoutPrequelZero = trimmed.replace(PREQUEL_ZERO_SUFFIX, "").trim();
  if (withoutPrequelZero.length > 0 && withoutPrequelZero.length < trimmed.length) {
    return franchiseRootFromTitle(withoutPrequelZero);
  }

  const withoutYear = trimmed.replace(/\s*\(\d{4}\)\s*$/, "").trim();
  if (withoutYear.length > 0 && withoutYear.length < trimmed.length) {
    return franchiseRootFromTitle(withoutYear);
  }

  return trimmed;
}

export function displayTitleFromAniList(title: AniListMediaTitle): string {
  return franchiseRootFromTitle(getAniListDisplayTitle(title));
}

/**
 * Candidate franchise roots for DB lookup: canonical root first, then a legacy
 * colon-trimmed fallback to match rows created by older normalization logic.
 */
export function franchiseLookupRoots(title: string): string[] {
  const root = franchiseRootFromTitle(title);
  const roots = [root];
  const legacyBase = legacyColonBase(root);
  if (legacyBase) roots.push(legacyBase);
  return [...new Set(roots.filter(Boolean))];
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

/** True when two titles normalize to the same franchise root. */
export function sameFranchiseTitle(a: string, b: string): boolean {
  const aKeys = new Set(franchiseMatchKeys(a));
  const bKeys = franchiseMatchKeys(b);
  return bKeys.some((key) => aKeys.has(key));
}
