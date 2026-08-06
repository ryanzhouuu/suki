import { RULE_THRESHOLDS } from "./rule-config";
import { candidate, clamp01, evidence } from "./rule-helpers";
import type { FingerprintRule } from "./rule-types";

export const shortFormLoyalistRule: FingerprintRule = {
  id: "short-form-loyalist",
  family: "format",
  label: "Short-Form Loyalist",
  summary: "You are especially good at finishing a story before it becomes a semester-long commitment.",
  editorialPriority: 21,
  opposingTraitIds: ["long-haul-legend"],
  evaluate(facts) {
    const denominator = facts.completedEpisodeSignals.length;
    const share = denominator > 0 ? facts.shortEpisodeSignals.length / denominator : 0;
    if (
      denominator < RULE_THRESHOLDS.shortMinimumFranchises ||
      share < RULE_THRESHOLDS.shortMinimumShare
    ) {
      return null;
    }
    const names = facts.shortEpisodeSignals
      .slice(0, 3)
      .map((signal) => signal.franchise.title)
      .join(", ");
    return candidate(shortFormLoyalistRule, clamp01(share), [
      evidence(
        "episode-length",
        `${facts.shortEpisodeSignals.length} of ${denominator} completed franchises are ${RULE_THRESHOLDS.shortMaximumEpisodes} episodes or fewer.`,
        { value: facts.shortEpisodeSignals.length, denominator },
      ),
      evidence("short-form-titles", `Compact finishes include ${names}.`, {
        seriesIds: facts.shortEpisodeSignals
          .slice(0, 3)
          .map((signal) => signal.franchise.id),
      }),
    ]);
  },
};

export const longHaulLegendRule: FingerprintRule = {
  id: "long-haul-legend",
  family: "format",
  label: "Long-Haul Legend",
  summary: "You are willing to stay with a story when it asks for the long version of your attention.",
  editorialPriority: 20,
  opposingTraitIds: ["short-form-loyalist"],
  evaluate(facts) {
    const longEpisodes = facts.longEpisodeSignals.reduce(
      (sum, signal) => sum + signal.episodes,
      0,
    );
    const episodeShare =
      facts.completedEpisodeTotal > 0
        ? longEpisodes / facts.completedEpisodeTotal
        : 0;
    if (
      facts.longEpisodeSignals.length < RULE_THRESHOLDS.longMinimumFranchises ||
      episodeShare < RULE_THRESHOLDS.longMinimumEpisodeShare
    ) {
      return null;
    }
    const names = facts.longEpisodeSignals
      .slice(0, 3)
      .map((signal) => signal.franchise.title)
      .join(", ");
    return candidate(
      longHaulLegendRule,
      clamp01(episodeShare * 0.7 + (facts.longEpisodeSignals.length / 10) * 0.3),
      [
        evidence(
          "episode-length",
          `${Math.round(episodeShare * 100)}% of your known completed episodes come from franchises with at least 40 episodes.`,
          {
            value: Math.round(episodeShare * facts.completedEpisodeTotal),
            denominator: facts.completedEpisodeTotal,
          },
        ),
        evidence("long-form-titles", `Long-haul finishes include ${names}.`, {
          seriesIds: facts.longEpisodeSignals
            .slice(0, 3)
            .map((signal) => signal.franchise.id),
        }),
      ],
    );
  },
};

export const movieNightRegularRule: FingerprintRule = {
  id: "movie-night-regular",
  family: "format",
  label: "Movie Night Regular",
  summary: "Completed movies are a meaningful part of the way you spend anime time.",
  editorialPriority: 19,
  evaluate(facts) {
    const denominator = facts.knownCompletedFormatCount;
    const share =
      denominator > 0 ? facts.completedMovieFranchises.length / denominator : 0;
    if (
      facts.completedMovieFranchises.length <
        RULE_THRESHOLDS.movieMinimumFranchises ||
      denominator < RULE_THRESHOLDS.movieMinimumKnownFormats ||
      share < RULE_THRESHOLDS.movieMinimumShare
    ) {
      return null;
    }
    const movies = facts.completedMovieFranchises.slice(0, 3);
    return candidate(movieNightRegularRule, clamp01(share), [
      evidence(
        "movie-completions",
        `${facts.completedMovieFranchises.length} completed franchises include movie entries.`,
        { value: facts.completedMovieFranchises.length, denominator },
      ),
      evidence(
        "movie-titles",
        `Movie-night regulars include ${movies.map((item) => item.title).join(", ")}.`,
        { seriesIds: movies.map((item) => item.id) },
      ),
    ]);
  },
};

export const formatRules = [
  shortFormLoyalistRule,
  longHaulLegendRule,
  movieNightRegularRule,
] as const;
