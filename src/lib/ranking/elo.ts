import { ELO_INITIAL_SCORE, RANKING_ALGORITHM_VERSION } from "@/lib/constants";
import type { Enums } from "@/types/database";

const K = 32;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export function updateElo(
  winnerRating: number,
  loserRating: number,
): { winner: number; loser: number } {
  const expectedWinner = expectedScore(winnerRating, loserRating);
  const expectedLoser = expectedScore(loserRating, winnerRating);

  return {
    winner: winnerRating + K * (1 - expectedWinner),
    loser: loserRating + K * (0 - expectedLoser),
  };
}

export function confidenceFromComparisonCount(count: number): Enums<"ranking_confidence"> {
  if (count >= 8) return "high";
  if (count >= 3) return "medium";
  return "low";
}

export type EloEntityState = {
  entityId: string;
  score: number;
  comparisonCount: number;
};

/** @deprecated Use EloEntityState */
export type EloAnimeState = EloEntityState & { animeId: string };

export function applyComparison(
  scores: Map<string, EloEntityState>,
  winnerId: string,
  loserId: string,
) {
  const winner = scores.get(winnerId) ?? {
    entityId: winnerId,
    score: ELO_INITIAL_SCORE,
    comparisonCount: 0,
  };
  const loser = scores.get(loserId) ?? {
    entityId: loserId,
    score: ELO_INITIAL_SCORE,
    comparisonCount: 0,
  };

  const updated = updateElo(winner.score, loser.score);

  scores.set(winnerId, {
    entityId: winnerId,
    score: updated.winner,
    comparisonCount: winner.comparisonCount + 1,
  });
  scores.set(loserId, {
    entityId: loserId,
    score: updated.loser,
    comparisonCount: loser.comparisonCount + 1,
  });
}

export { RANKING_ALGORITHM_VERSION };
