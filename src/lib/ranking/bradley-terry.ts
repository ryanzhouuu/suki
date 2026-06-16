import { BT_PRIOR_LAMBDA, ELO_INITIAL_SCORE } from "@/lib/constants";

import type { ResolvedComparison } from "./preference-graph";

/**
 * Bradley-Terry ranking: each entity i has a latent strength beta_i, and the
 * probability that i is preferred over j is sigma(beta_i - beta_j). Strengths are
 * fit by penalized maximum-a-posteriori over the entire comparison graph at once,
 * so the result is independent of the order comparisons were entered (unlike the
 * sequential Elo replay it replaces) and exploits transitivity (A>B, B>C lifts A
 * over C without a direct comparison).
 *
 * See docs/ranking-design.md for the model, objective, gradient/Hessian, and the
 * display-scaling rationale.
 */

export type BradleyTerryState = {
  beta: number;
  /** Variance proxy 1 / H_ii from the Hessian diagonal; larger = less certain. */
  uncertainty: number;
  /** Number of resolved comparisons this entity participated in. */
  comparisonCount: number;
};

export type FitBradleyTerryOptions = {
  /** Gaussian-prior strength. Keeps beta finite on disconnected/all-win graphs. */
  lambda?: number;
  maxIterations?: number;
  tolerance?: number;
};

/** Numerically stable logistic function. */
function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

/** Probability that an entity with strength `betaA` is preferred over `betaB`. */
export function expectedProb(betaA: number, betaB: number): number {
  return sigmoid(betaA - betaB);
}

/**
 * Map a Bradley-Terry strength onto an Elo-compatible display score. With this
 * affine map, `expectedProb(betaA, betaB)` equals the familiar
 * `1 / (1 + 10 ** (-(scoreA - scoreB) / 400))`, so existing score-based UI and
 * tier bands keep working.
 */
export function betaToScore(beta: number): number {
  return ELO_INITIAL_SCORE + (400 / Math.LN10) * beta;
}

type Adjacency = Map<string, { opponent: string; won: boolean }[]>;

function buildAdjacency(
  seriesIds: string[],
  edges: ResolvedComparison[],
): Adjacency {
  const adjacency: Adjacency = new Map();
  for (const id of seriesIds) {
    adjacency.set(id, []);
  }

  for (const { winnerId, loserId } of edges) {
    // Ignore edges referencing entities outside the ranked set.
    const winnerAdj = adjacency.get(winnerId);
    const loserAdj = adjacency.get(loserId);
    if (!winnerAdj || !loserAdj) continue;

    winnerAdj.push({ opponent: loserId, won: true });
    loserAdj.push({ opponent: winnerId, won: false });
  }

  return adjacency;
}

/**
 * Fit Bradley-Terry strengths for `seriesIds` given resolved `edges`
 * (`winnerId` beat `loserId`). Every id in `seriesIds` appears in the result,
 * even with zero edges (`beta = 0`, maximum uncertainty).
 *
 * Solved by coordinate-wise Newton ascent on the concave penalized
 * log-likelihood — for entity i, repeatedly apply `beta_i += grad_i / H_ii`
 * where
 *   grad_i = Σ_opp [ I(i won) − sigma(beta_i − beta_opp) ] − lambda·beta_i
 *   H_ii   = lambda + Σ_opp sigma(beta_i − beta_opp)·(1 − sigma(...))
 * sweeping until the largest update falls below `tolerance`.
 */
export function fitBradleyTerry(
  seriesIds: string[],
  edges: ResolvedComparison[],
  options?: FitBradleyTerryOptions,
): Map<string, BradleyTerryState> {
  const lambda = options?.lambda ?? BT_PRIOR_LAMBDA;
  const maxIterations = options?.maxIterations ?? 100;
  const tolerance = options?.tolerance ?? 1e-9;

  const adjacency = buildAdjacency(seriesIds, edges);
  const beta = new Map<string, number>();
  for (const id of seriesIds) {
    beta.set(id, 0);
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    let maxDelta = 0;

    for (const id of seriesIds) {
      const betaId = beta.get(id)!;
      let gradient = -lambda * betaId;
      let hessian = lambda;

      for (const { opponent, won } of adjacency.get(id)!) {
        const p = sigmoid(betaId - beta.get(opponent)!);
        gradient += (won ? 1 : 0) - p;
        hessian += p * (1 - p);
      }

      const delta = gradient / hessian;
      beta.set(id, betaId + delta);
      maxDelta = Math.max(maxDelta, Math.abs(delta));
    }

    if (maxDelta < tolerance) break;
  }

  const result = new Map<string, BradleyTerryState>();
  for (const id of seriesIds) {
    const betaId = beta.get(id)!;
    const opponents = adjacency.get(id)!;

    let hessian = lambda;
    for (const { opponent } of opponents) {
      const p = sigmoid(betaId - beta.get(opponent)!);
      hessian += p * (1 - p);
    }

    result.set(id, {
      beta: betaId,
      uncertainty: 1 / hessian,
      comparisonCount: opponents.length,
    });
  }

  return result;
}
