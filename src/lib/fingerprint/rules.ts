import type { FingerprintFacts } from "./facts";
import {
  CURATED_THEME_CLUSTERS,
  FINGERPRINT_RULEBOOK_VERSION,
  POPULARITY_BANDS,
  RULE_THRESHOLDS,
} from "./rule-config";
import type { FingerprintCandidate, FingerprintRule } from "./rule-types";
import { behaviorRules } from "./rules-behavior";
import { breadthDiscoveryRules } from "./rules-breadth-discovery";
import { contentRules } from "./rules-content";
import { formatRules } from "./rules-format";
import { ratingRankingRules } from "./rules-rating-ranking";

export type { FingerprintCandidate, FingerprintRule } from "./rule-types";
export {
  FINGERPRINT_RULEBOOK_VERSION,
  POPULARITY_BANDS,
  RULE_THRESHOLDS,
};

export const FINGERPRINT_RULES: readonly FingerprintRule[] = [
  ...contentRules,
  ...breadthDiscoveryRules,
  ...formatRules,
  ...behaviorRules,
  ...ratingRankingRules,
];

/** Evaluate each rule in isolation so one defective rule cannot blank the set. */
export function evaluateFingerprintRules(
  facts: FingerprintFacts,
  rules: readonly FingerprintRule[] = FINGERPRINT_RULES,
): FingerprintCandidate[] {
  const candidates: FingerprintCandidate[] = [];
  for (const rule of rules) {
    try {
      const result = rule.evaluate(facts);
      if (result) candidates.push(result);
    } catch {
      // A defective rule must not blank the otherwise valid trait set.
    }
  }
  return candidates;
}

export function getCuratedThemeClusters() {
  return CURATED_THEME_CLUSTERS;
}
