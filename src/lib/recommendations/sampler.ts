import { REASON_CODES } from "./constants";
import { createSeededRandom } from "./seeded-random";
import type { ReasonCode } from "./constants";
import {
  isEmptyRequestPrefs,
  type RecommendationRequestPrefs,
} from "./request-prefs";
import { matchesRequestPrefs } from "./request-filter";
import type { ScoredRecommendation } from "./types";

const STRONG_RATIO = 0.6;
const DIVERSE_RATIO = 0.25;
const WILDCARD_RATIO = 0.15;

function slotCounts(limit: number): {
  strong: number;
  diverse: number;
  wildcard: number;
} {
  const strong = Math.max(1, Math.round(limit * STRONG_RATIO));
  const diverse = Math.max(0, Math.round(limit * DIVERSE_RATIO));
  const wildcard = Math.max(0, limit - strong - diverse);
  return { strong, diverse, wildcard };
}

function pickUnique(
  pool: ScoredRecommendation[],
  count: number,
  used: Set<string>,
  rand: () => number,
  prefer: (item: ScoredRecommendation) => number = () => 0,
): ScoredRecommendation[] {
  const available = pool.filter((r) => !used.has(r.anime.id));
  if (available.length === 0 || count <= 0) return [];

  const picked: ScoredRecommendation[] = [];
  const remaining = [...available];

  while (picked.length < count && remaining.length > 0) {
    const weights = remaining.map((r) => Math.max(0.01, prefer(r) + 0.01));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rand() * total;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      roll -= weights[idx];
      if (roll <= 0) break;
    }
    const choice = remaining[Math.min(idx, remaining.length - 1)];
    picked.push(choice);
    used.add(choice.anime.id);
    remaining.splice(remaining.indexOf(choice), 1);
  }

  return picked;
}

function withReason(
  rec: ScoredRecommendation,
  code: ReasonCode,
): ScoredRecommendation {
  const reasonCodes = rec.reasonCodes.includes(code)
    ? rec.reasonCodes
    : [...rec.reasonCodes, code];
  return { ...rec, reasonCodes };
}

function topGenreSet(strong: ScoredRecommendation[]): Set<string> {
  const genres = new Set<string>();
  for (const rec of strong.slice(0, 3)) {
    for (const g of rec.anime.genres.slice(0, 2)) {
      genres.add(g);
    }
  }
  return genres;
}

function isDiverseCandidate(
  rec: ScoredRecommendation,
  strong: ScoredRecommendation[],
  anchorGenres: Set<string>,
): boolean {
  if (strong.length === 0) return true;
  const lowSimilarity = rec.similarityScore < 0.72;
  const genreShift = rec.anime.genres.some((g) => !anchorGenres.has(g));
  return lowSimilarity || genreShift;
}

function isWildcardEligible(
  rec: ScoredRecommendation,
  prefs: RecommendationRequestPrefs,
  strongMedianSimilarity: number,
): boolean {
  if (!isEmptyRequestPrefs(prefs) && !matchesRequestPrefs(rec.anime, prefs)) {
    return false;
  }
  if (strongMedianSimilarity <= 0) return true;
  return rec.similarityScore < strongMedianSimilarity - 0.05;
}

/**
 * Adventurous sampling: mix top scorers, diverse picks, and wildcards.
 * Same seed => same order; different seed => different refresh.
 */
export function sampleAdventurous(
  scored: ScoredRecommendation[],
  prefs: RecommendationRequestPrefs,
  seed: string,
  limit: number,
): ScoredRecommendation[] {
  if (scored.length === 0) return [];
  if (scored.length <= limit) {
    return scored.map((r) => ({ ...r }));
  }

  const rand = createSeededRandom(seed);
  const sorted = [...scored].sort((a, b) => b.finalScore - a.finalScore);
  const { strong: strongN, diverse: diverseN, wildcard: wildcardN } =
    slotCounts(limit);

  const used = new Set<string>();
  const result: ScoredRecommendation[] = [];

  const strongPool = sorted.slice(0, Math.min(sorted.length, strongN * 3));
  const strong = pickUnique(strongPool, strongN, used, rand, (r) => r.finalScore);
  for (const rec of strong) {
    result.push(rec);
  }

  const anchorGenres = topGenreSet(strong);
  const strongSims = strong.map((r) => r.similarityScore).sort((a, b) => a - b);
  const medianSim =
    strongSims.length > 0
      ? strongSims[Math.floor(strongSims.length / 2)]
      : 0.75;

  const diversePool = sorted.filter(
    (r) =>
      !used.has(r.anime.id) &&
      isDiverseCandidate(r, strong, anchorGenres),
  );
  const diverse = pickUnique(
    diversePool.length > 0 ? diversePool : sorted.filter((r) => !used.has(r.anime.id)),
    diverseN,
    used,
    rand,
    (r) => 1 - r.similarityScore,
  );
  for (const rec of diverse) {
    result.push(withReason(rec, REASON_CODES.diversePick));
  }

  const wildcardPool = sorted.filter(
    (r) =>
      !used.has(r.anime.id) &&
      isWildcardEligible(r, prefs, medianSim),
  );
  const wildcards = pickUnique(
    wildcardPool.length > 0
      ? wildcardPool
      : sorted.filter((r) => !used.has(r.anime.id)),
    wildcardN,
    used,
    rand,
    (r) => 1 - r.finalScore,
  );
  for (const rec of wildcards) {
    result.push(withReason(rec, REASON_CODES.wildcardPick));
  }

  if (result.length < limit) {
    const fill = sorted.filter((r) => !used.has(r.anime.id));
    for (const rec of fill) {
      if (result.length >= limit) break;
      used.add(rec.anime.id);
      result.push(rec);
    }
  }

  return result.slice(0, limit);
}
