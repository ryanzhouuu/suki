import { POPULARITY_BANDS, RULE_THRESHOLDS } from "./rule-config";
import { candidate, clamp01, evidence, titleList } from "./rule-helpers";
import type { FingerprintRule } from "./rule-types";

export const eclecticExplorerRule: FingerprintRule = {
  id: "eclectic-explorer",
  family: "breadth",
  label: "Eclectic Explorer",
  summary: "Your strongest engagement spreads across a genuinely wide range of genres.",
  editorialPriority: 26,
  opposingTraitIds: ["focused-specialist"],
  evaluate(facts) {
    const top = facts.genreSignals[0];
    if (
      facts.positiveFranchises.length < RULE_THRESHOLDS.eclecticMinimumPositive ||
      facts.genreSignals.length < RULE_THRESHOLDS.eclecticMinimumSignals ||
      !top ||
      top.share > RULE_THRESHOLDS.eclecticMaximumTopShare
    ) {
      return null;
    }
    const support = facts.genreSignals
      .slice(0, 3)
      .map((signal) => signal.key)
      .join(", ");
    return candidate(
      eclecticExplorerRule,
      clamp01((1 - top.share) * 0.7 + (facts.genreSignals.length / 12) * 0.3),
      [
        evidence(
          "genre-breadth",
          `${facts.positiveFranchises.length} positively engaged franchises span ${facts.genreSignals.length} genres.`,
          {
            value: facts.genreSignals.length,
            denominator: facts.positiveFranchises.length,
          },
        ),
        evidence("top-genres", `Your most common genres are ${support}.`, {
          value: facts.genreSignals.length,
        }),
      ],
    );
  },
};

export const focusedSpecialistRule: FingerprintRule = {
  id: "focused-specialist",
  family: "breadth",
  label: "Focused Specialist",
  summary: "One coherent lane clearly anchors the way you choose what to watch.",
  editorialPriority: 25,
  opposingTraitIds: ["eclectic-explorer", "genre-devotee"],
  evaluate(facts) {
    const top = facts.genreSignals[0];
    const second = facts.genreSignals[1];
    const margin = top && second ? top.share - second.share : top?.share ?? 0;
    if (
      facts.positiveFranchises.length < RULE_THRESHOLDS.focusedMinimumPositive ||
      !top ||
      top.share < RULE_THRESHOLDS.focusedMinimumShare ||
      margin < RULE_THRESHOLDS.focusedMinimumMargin
    ) {
      return null;
    }
    const support = titleList(facts, (item) => item.genres.includes(top.key));
    return candidate(
      focusedSpecialistRule,
      clamp01(top.share * 0.7 + margin * 0.3),
      [
        evidence(
          "genre-concentration",
          `${top.key} appears in ${top.count} of ${facts.positiveFranchises.length} positively engaged franchises.`,
          { value: top.count, denominator: facts.positiveFranchises.length },
        ),
        evidence("supporting-titles", `The pattern shows up in ${support.titles}.`, {
          seriesIds: support.ids,
        }),
      ],
    );
  },
};

function popularityRule(options: {
  id: "deep-cut-devotee" | "certified-crowd-pleaser";
  label: string;
  summary: string;
  editorialPriority: number;
  opposingTraitId: "deep-cut-devotee" | "certified-crowd-pleaser";
  share: "lowPopularityFavoriteShare" | "highPopularityFavoriteShare";
  matches: (popularity: number) => boolean;
  evidenceText: (percentage: number, count: number) => string;
}): FingerprintRule {
  const rule: FingerprintRule = {
    id: options.id,
    family: "discovery",
    label: options.label,
    summary: options.summary,
    editorialPriority: options.editorialPriority,
    opposingTraitIds: [options.opposingTraitId],
    evaluate(facts) {
      const favorites = facts.knownPopularityFavorites;
      const share = facts[options.share];
      if (
        favorites.length < RULE_THRESHOLDS.popularityMinimumFavorites ||
        share < RULE_THRESHOLDS.popularityMinimumBandShare
      ) {
        return null;
      }
      const names = titleList(facts, (item) =>
        favorites.some((favorite) => favorite.franchise.id === item.id),
      );
      return candidate(rule, clamp01(share), [
        evidence(
          "popularity-band",
          options.evidenceText(Math.round(share * 100), favorites.length),
          {
            value: favorites.filter((item) => options.matches(item.popularity)).length,
            denominator: favorites.length,
            seriesIds: names.ids,
          },
        ),
        evidence("favorite-titles", `That pattern includes ${names.titles}.`, {
          seriesIds: names.ids,
        }),
      ]);
    },
  };
  return rule;
}

export const deepCutDevoteeRule = popularityRule({
  id: "deep-cut-devotee",
  label: "Deep-Cut Devotee",
  summary: "Your confidently ranked favorites tend to live well outside the mainstream.",
  editorialPriority: 24,
  opposingTraitId: "certified-crowd-pleaser",
  share: "lowPopularityFavoriteShare",
  matches: (popularity) => popularity <= POPULARITY_BANDS.deepCutMaximum,
  evidenceText: (percentage, count) =>
    `${percentage}% of ${count} confidently ranked favorites are popular with ${POPULARITY_BANDS.deepCutMaximum.toLocaleString()} or fewer AniList users.`,
});

export const certifiedCrowdPleaserRule = popularityRule({
  id: "certified-crowd-pleaser",
  label: "Certified Crowd-Pleaser",
  summary: "Your confidently ranked favorites are popular for a reason—and you agree with it.",
  editorialPriority: 23,
  opposingTraitId: "deep-cut-devotee",
  share: "highPopularityFavoriteShare",
  matches: (popularity) => popularity >= POPULARITY_BANDS.crowdPleaserMinimum,
  evidenceText: (percentage, count) =>
    `${percentage}% of ${count} confidently ranked favorites are popular with at least ${POPULARITY_BANDS.crowdPleaserMinimum.toLocaleString()} AniList users.`,
});

export const breadthDiscoveryRules = [
  eclecticExplorerRule,
  focusedSpecialistRule,
  deepCutDevoteeRule,
  certifiedCrowdPleaserRule,
] as const;
