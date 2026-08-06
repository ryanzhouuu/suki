import { RULE_THRESHOLDS } from "./rule-config";
import { candidate, clamp01, evidence, round, titleList } from "./rule-helpers";
import type { FingerprintRule } from "./rule-types";

export const reservedApplauseRule: FingerprintRule = {
  id: "reserved-applause",
  family: "rating",
  label: "Reserved Applause",
  summary: "You make your highest scores mean something by handing them out carefully.",
  editorialPriority: 15,
  opposingTraitIds: ["heart-on-sleeve-rater"],
  evaluate(facts) {
    if (
      facts.scoredFranchises.length < RULE_THRESHOLDS.ratingMinimumScored ||
      facts.meanPersonalScore === null ||
      facts.meanPersonalScore > RULE_THRESHOLDS.reservedMaximumMean
    ) {
      return null;
    }
    const reservedCount = facts.scoredFranchises.filter(
      (item) =>
        (item.meanPersonalScore ?? 10) <= RULE_THRESHOLDS.reservedMaximumMean,
    ).length;
    return candidate(
      reservedApplauseRule,
      clamp01((10 - facts.meanPersonalScore) / 4),
      [
        evidence(
          "average-score",
          `Your average score is ${round(facts.meanPersonalScore)} across ${facts.scoredFranchises.length} franchises.`,
          {
            value: round(facts.meanPersonalScore),
            denominator: facts.scoredFranchises.length,
          },
        ),
        evidence(
          "score-pattern",
          `${reservedCount} scored franchises are at or below ${RULE_THRESHOLDS.reservedMaximumMean}.`,
          { value: reservedCount, denominator: facts.scoredFranchises.length },
        ),
      ],
    );
  },
};

export const heartOnSleeveRaterRule: FingerprintRule = {
  id: "heart-on-sleeve-rater",
  family: "rating",
  label: "Heart-on-Sleeve Rater",
  summary: "When a show works for you, your scores are happy to say so.",
  editorialPriority: 14,
  opposingTraitIds: ["reserved-applause"],
  evaluate(facts) {
    if (
      facts.scoredFranchises.length < RULE_THRESHOLDS.ratingMinimumScored ||
      facts.meanPersonalScore === null ||
      facts.meanPersonalScore < RULE_THRESHOLDS.heartMinimumMean
    ) {
      return null;
    }
    const enthusiasticCount = facts.scoredFranchises.filter(
      (item) =>
        (item.meanPersonalScore ?? 0) >= RULE_THRESHOLDS.heartMinimumMean,
    ).length;
    return candidate(
      heartOnSleeveRaterRule,
      clamp01(facts.meanPersonalScore / 10),
      [
        evidence(
          "average-score",
          `Your average score is ${round(facts.meanPersonalScore)} across ${facts.scoredFranchises.length} franchises.`,
          {
            value: round(facts.meanPersonalScore),
            denominator: facts.scoredFranchises.length,
          },
        ),
        evidence(
          "score-pattern",
          `${enthusiasticCount} scored franchises reach ${RULE_THRESHOLDS.heartMinimumMean} or higher.`,
          {
            value: enthusiasticCount,
            denominator: facts.scoredFranchises.length,
          },
        ),
      ],
    );
  },
};

export const battleTestedFavoritesRule: FingerprintRule = {
  id: "battle-tested-favorites",
  family: "ranking",
  label: "Battle-Tested Favorites",
  summary: "Your favorites have survived enough comparisons to feel well earned.",
  editorialPriority: 13,
  evaluate(facts) {
    if (
      facts.rankedCount < RULE_THRESHOLDS.battleMinimumRanked ||
      facts.confidentRankShare < RULE_THRESHOLDS.battleMinimumConfidentShare
    ) {
      return null;
    }
    const names = titleList(facts, (item) => item.ranking !== null);
    return candidate(
      battleTestedFavoritesRule,
      clamp01(facts.confidentRankShare),
      [
        evidence(
          "ranking-confidence",
          `${Math.round(facts.confidentRankShare * 100)}% of ${facts.rankedCount} ranked franchises have medium or high confidence.`,
          {
            value: facts.confidentRankedCount,
            denominator: facts.rankedCount,
          },
        ),
        evidence(
          "ranked-favorites",
          `The ranked set starts with ${names.titles}.`,
          { seriesIds: names.ids },
        ),
      ],
    );
  },
};

export const ratingRankingRules = [
  reservedApplauseRule,
  heartOnSleeveRaterRule,
  battleTestedFavoritesRule,
] as const;
