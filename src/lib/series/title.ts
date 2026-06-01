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

/**
 * Strip season / part / cour markers from display titles.
 */
export function stripSeasonSuffix(title: string): string {
  let t = title.trim();

  t = t.replace(/\s+Season\s+\d+\b.*$/i, "");
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

  return base;
}

/**
 * When several normalized roots appear in one franchise cluster, prefer the
 * shortest title that is a prefix of the others (e.g. "Black Clover" over
 * "Black Clover: Sword of the Wizard King").
 */
export function pickConsolidatedFranchiseRoot(candidates: string[]): string {
  const unique = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (unique.length === 0) return "";
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

  // Unrelated titles in one graph (e.g. OP single + parent show): prefer majority
  // franchise root, not the shortest string ("Just Awake" vs "Hunter x Hunter").
  const counts = new Map<string, number>();
  for (const raw of unique) {
    const root = franchiseRootFromTitle(raw);
    counts.set(root, (counts.get(root) ?? 0) + 1);
  }

  let best = "";
  let bestCount = 0;
  for (const [root, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && root.length > best.length)
    ) {
      best = root;
      bestCount = count;
    }
  }

  return best || unique[0];
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
  return franchiseRootFromTitle(a) === franchiseRootFromTitle(b);
}
