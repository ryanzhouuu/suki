import { pairKey } from "./canonical-pair";

/**
 * Active sampling for the comparison prompt: choose the next pair to compare by
 * expected information gain rather than a heuristic. The most informative
 * comparison is a close matchup (predicted probability near 0.5) between series
 * the model is still uncertain about, so we score a pair by
 *
 *   score(i, j) = p·(1 − p) · (u_i + u_j)
 *
 * where p = P(i ≻ j) from the Bradley-Terry display scores and u is the stored
 * per-series uncertainty. See docs/ranking-design.md §5.
 */

export type SeriesStat = {
  seriesId: string;
  /** Bradley-Terry display score (derived_series_rankings.score). */
  score: number;
  /** Variance proxy (derived_series_rankings.uncertainty); larger = less sure. */
  uncertainty: number;
  comparisonCount: number;
};

/** Below this `scorePair` value, a pair teaches us too little to be worth asking. */
export const STOP_SCORE_THRESHOLD = 0.5;
/** Sample from the top-K most informative candidates (variety, not strict argmax). */
export const TOP_K = 10;
/** Chance of a uniform pick among the top-K instead of a score-weighted one. */
export const EPSILON = 0.12;
/** Only consider pairs within this many rank positions (plus anchor pairs). */
export const RANK_WINDOW = 8;
/** A series needs at least this many comparisons to serve as an anchor. */
export const ANCHOR_MIN_COMPARISONS = 5;

export type SelectNextPairOptions = {
  rng: () => number;
  stopThreshold?: number;
  topK?: number;
  epsilon?: number;
  rankWindow?: number;
  anchorMinComparisons?: number;
};

/** Probability the higher-scored side wins, on the Elo display scale. */
export function pairProbability(scoreA: number, scoreB: number): number {
  return 1 / (1 + 10 ** (-(scoreA - scoreB) / 400));
}

/** Expected information gain of comparing two series. */
export function scorePair(a: SeriesStat, b: SeriesStat): number {
  const p = pairProbability(a.score, b.score);
  return p * (1 - p) * (a.uncertainty + b.uncertainty);
}

function byScoreDesc(stats: SeriesStat[]): SeriesStat[] {
  return [...stats].sort((a, b) => b.score - a.score);
}

/**
 * Up to 3 confident series spread across the score range (top / middle / bottom),
 * used to localize an uncertain series with a few well-separated comparisons.
 */
export function selectAnchors(
  stats: SeriesStat[],
  anchorMinComparisons = ANCHOR_MIN_COMPARISONS,
): SeriesStat[] {
  const confident = byScoreDesc(
    stats.filter((s) => s.comparisonCount >= anchorMinComparisons),
  );
  if (confident.length <= 3) return confident;

  const last = confident.length - 1;
  const picks = [confident[0], confident[Math.floor(last / 2)], confident[last]];
  // De-dup in case indices collide on a short list.
  const seen = new Set<string>();
  return picks.filter((s) => {
    if (seen.has(s.seriesId)) return false;
    seen.add(s.seriesId);
    return true;
  });
}

/** True when there aren't enough confident series to anchor against. */
export function isBootstrap(
  stats: SeriesStat[],
  anchorMinComparisons = ANCHOR_MIN_COMPARISONS,
): boolean {
  return (
    stats.filter((s) => s.comparisonCount >= anchorMinComparisons).length < 3
  );
}

function generateCandidates(
  stats: SeriesStat[],
  seenPairs: Set<string>,
  rankWindow: number,
  anchorMinComparisons: number,
): [SeriesStat, SeriesStat][] {
  const sorted = byScoreDesc(stats);
  const candidates: [SeriesStat, SeriesStat][] = [];
  const seen = new Set(seenPairs);

  const add = (a: SeriesStat, b: SeriesStat) => {
    const key = pairKey(a.seriesId, b.seriesId);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push([a, b]);
  };

  if (isBootstrap(stats, anchorMinComparisons)) {
    // Thin ranking: every unseen pair is fair game (n is small here).
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) add(sorted[i], sorted[j]);
    }
    return candidates;
  }

  // Rank-window neighbours for everyone.
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j <= i + rankWindow && j < sorted.length; j++) {
      add(sorted[i], sorted[j]);
    }
  }

  // Anchor pairs to localize uncertain (under-compared) series across the range.
  const anchors = selectAnchors(stats, anchorMinComparisons);
  for (const s of sorted) {
    if (s.comparisonCount >= anchorMinComparisons) continue;
    for (const anchor of anchors) {
      if (anchor.seriesId === s.seriesId) continue;
      add(s, anchor);
    }
  }

  return candidates;
}

type ScoredCandidate = { a: SeriesStat; b: SeriesStat; score: number };

function chooseFromTopK(
  scored: ScoredCandidate[],
  rng: () => number,
  topK: number,
  epsilon: number,
): ScoredCandidate {
  const pool = scored.slice(0, topK);
  if (pool.length === 1) return pool[0];

  if (rng() < epsilon) {
    // Variety pick: uniform among the top-K.
    return pool[Math.floor(rng() * pool.length)];
  }

  // Score-weighted pick.
  const total = pool.reduce((sum, c) => sum + c.score, 0);
  let threshold = rng() * total;
  for (const candidate of pool) {
    threshold -= candidate.score;
    if (threshold <= 0) return candidate;
  }
  return pool[pool.length - 1];
}

/**
 * Choose the next comparison pair, or `null` when no remaining pair is informative
 * enough (the ranking is settled — the stop signal). Returns the two series ids.
 */
export function selectNextPair(
  stats: SeriesStat[],
  seenPairs: Set<string>,
  options: SelectNextPairOptions,
): [string, string] | null {
  if (stats.length < 2) return null;

  const stopThreshold = options.stopThreshold ?? STOP_SCORE_THRESHOLD;
  const topK = options.topK ?? TOP_K;
  const epsilon = options.epsilon ?? EPSILON;
  const rankWindow = options.rankWindow ?? RANK_WINDOW;
  const anchorMinComparisons =
    options.anchorMinComparisons ?? ANCHOR_MIN_COMPARISONS;

  const candidates = generateCandidates(
    stats,
    seenPairs,
    rankWindow,
    anchorMinComparisons,
  );

  const scored = candidates
    .map(([a, b]) => ({ a, b, score: scorePair(a, b) }))
    .filter((c) => c.score >= stopThreshold)
    .sort((x, y) => y.score - x.score);

  if (scored.length === 0) return null;

  const chosen = chooseFromTopK(scored, options.rng, topK, epsilon);
  return [chosen.a.seriesId, chosen.b.seriesId];
}
