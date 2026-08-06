import {
  CURATED_GENRES,
  CURATED_THEME_CLUSTERS,
  RULE_THRESHOLDS,
} from "./rule-config";
import { candidate, clamp01, compareStrings, evidence, titleList } from "./rule-helpers";
import type { FingerprintRule } from "./rule-types";

export const genreDevoteeRule: FingerprintRule = {
  id: "genre-devotee",
  family: "content",
  label: "Genre Devotee",
  summary: "One genre keeps showing up wherever your strongest engagement lives.",
  editorialPriority: 30,
  opposingTraitIds: ["focused-specialist"],
  evaluate(facts) {
    if (facts.positiveFranchises.length < RULE_THRESHOLDS.genreMinimumPositive) {
      return null;
    }
    const top = facts.genreSignals[0];
    if (!top || top.share < RULE_THRESHOLDS.genreMinimumShare) return null;
    const copy = CURATED_GENRES[top.key];
    if (!copy) return null;
    const confidentSupport = facts.confidentlyRankedFranchises.filter(
      (item) => item.isPositiveEngagement && item.genres.includes(top.key),
    );
    if (
      confidentSupport.length < RULE_THRESHOLDS.genreMinimumConfidentSupport
    ) {
      return null;
    }
    const support = titleList(
      facts,
      (item) => item.isPositiveEngagement && item.genres.includes(top.key),
    );
    return candidate(
      genreDevoteeRule,
      clamp01(top.share * 0.65 + top.weightedShare * 0.35),
      [
        evidence(
          "genre-concentration",
          `${top.count} of ${facts.positiveFranchises.length} positively engaged franchises include ${top.key}.`,
          { value: top.count, denominator: facts.positiveFranchises.length },
        ),
        evidence(
          "ranked-support",
          `${confidentSupport.length} confidently ranked favorites include ${top.key}, including ${support.titles}.`,
          {
            value: confidentSupport.length,
            denominator: facts.confidentRankedCount,
            seriesIds: support.ids,
          },
        ),
      ],
      copy,
    );
  },
};

export const themeMagnetRule: FingerprintRule = {
  id: "theme-magnet",
  family: "content",
  label: "Theme Magnet",
  summary: "A recurring story theme keeps finding its way into your library.",
  editorialPriority: 28,
  evaluate(facts) {
    if (facts.positiveFranchises.length < RULE_THRESHOLDS.themeMinimumPositive) {
      return null;
    }
    const matches = CURATED_THEME_CLUSTERS.map((cluster) => ({
      cluster,
      matched: facts.positiveFranchises.filter((item) =>
        item.tags.some((tag) => cluster.tags.includes(tag)),
      ),
      ranked: facts.confidentlyRankedFranchises.filter((item) =>
        item.tags.some((tag) => cluster.tags.includes(tag)),
      ),
    })).sort(
      (a, b) =>
        b.matched.length - a.matched.length ||
        b.ranked.length - a.ranked.length ||
        compareStrings(a.cluster.id, b.cluster.id),
    );
    const top = matches[0];
    if (
      !top ||
      top.matched.length / facts.positiveFranchises.length <
        RULE_THRESHOLDS.themeMinimumShare ||
      top.ranked.length < RULE_THRESHOLDS.themeMinimumConfidentSupport
    ) {
      return null;
    }
    const support = titleList(facts, (item) =>
      item.tags.some((tag) => top.cluster.tags.includes(tag)),
    );
    return candidate(
      themeMagnetRule,
      clamp01(
        (top.matched.length / facts.positiveFranchises.length) * 0.65 +
          (top.ranked.length / Math.max(1, facts.confidentRankedCount)) * 0.35,
      ),
      [
        evidence(
          "theme-concentration",
          `${top.matched.length} positively engaged franchises carry the ${top.cluster.id} theme cluster.`,
          {
            value: top.matched.length,
            denominator: facts.positiveFranchises.length,
          },
        ),
        evidence(
          "ranked-support",
          `${top.ranked.length} confidently ranked favorites carry that theme, including ${support.titles}.`,
          {
            value: top.ranked.length,
            denominator: facts.confidentRankedCount,
            seriesIds: support.ids,
          },
        ),
      ],
      { label: top.cluster.label, summary: top.cluster.summary },
    );
  },
};

export const contentRules = [genreDevoteeRule, themeMagnetRule] as const;
