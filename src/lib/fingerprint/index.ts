import { createHash } from "node:crypto";

import { deriveFingerprintFacts } from "./facts";
import { normalizeFingerprintInput } from "./normalize";
import {
  FINGERPRINT_RULEBOOK_VERSION,
  FINGERPRINT_RULES,
  POPULARITY_BANDS,
  RULE_THRESHOLDS,
  evaluateFingerprintRules,
} from "./rules";
import { selectFingerprintTraits } from "./select";
import {
  FINGERPRINT_TRAIT_IDS,
  FINGERPRINT_VERSION,
  type FingerprintBuildInput,
  type FingerprintEntry,
  type FingerprintRanking,
  type FingerprintState,
  type FingerprintTrait,
  type FingerprintTraitId,
  type FormingReason,
  type TasteFingerprint,
  type TraitEvidence,
  type TraitFamily,
} from "./types";

export {
  FINGERPRINT_TRAIT_IDS,
  FINGERPRINT_VERSION,
  type FingerprintBuildInput,
  type FingerprintEntry,
  type FingerprintRanking,
  type FingerprintState,
  type FingerprintTrait,
  type FingerprintTraitId,
  type FormingReason,
  type TasteFingerprint,
  type TraitEvidence,
  type TraitFamily,
};

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableFingerprintPayload(
  normalized: ReturnType<typeof normalizeFingerprintInput>,
) {
  return {
    version: FINGERPRINT_VERSION,
    rulebookVersion: FINGERPRINT_RULEBOOK_VERSION,
    thresholds: RULE_THRESHOLDS,
    popularityBands: POPULARITY_BANDS,
    rules: FINGERPRINT_RULES.map((rule) => ({
      id: rule.id,
      family: rule.family,
      opposingTraitIds: rule.opposingTraitIds ?? [],
      editorialPriority: rule.editorialPriority,
    })),
    rankingCount: normalized.rankingCount,
    franchises: normalized.franchises.map((franchise) => ({
      id: franchise.id,
      title: franchise.title,
      animeIds: franchise.animeIds,
      statusCounts: franchise.statusCounts,
      hasCompleted: franchise.hasCompleted,
      hasWatching: franchise.hasWatching,
      hasPaused: franchise.hasPaused,
      hasDropped: franchise.hasDropped,
      hasPlanToWatch: franchise.hasPlanToWatch,
      isStarted: franchise.isStarted,
      isPositiveEngagement: franchise.isPositiveEngagement,
      isSettled: franchise.isSettled,
      genres: franchise.genres,
      tags: franchise.tags,
      formats: franchise.formats,
      completedFormats: franchise.completedFormats,
      popularity: franchise.popularity,
      completedEpisodeTotal: franchise.completedEpisodeTotal,
      completedEpisodeMetadataComplete:
        franchise.completedEpisodeMetadataComplete,
      personalScores: franchise.personalScores,
      meanPersonalScore: franchise.meanPersonalScore,
      totalRewatchCount: franchise.totalRewatchCount,
      ranking: franchise.ranking
        ? {
            seriesId: franchise.ranking.seriesId,
            rank: franchise.ranking.rank,
            confidence: franchise.ranking.confidence,
            comparisonCount: franchise.ranking.comparisonCount,
            uncertainty: franchise.ranking.uncertainty,
            rankPercentile: franchise.ranking.rankPercentile,
          }
        : null,
    })),
  };
}

function unavailableHash(input: FingerprintBuildInput): string {
  const payload = {
    version: FINGERPRINT_VERSION,
    mappingStatus: "unavailable",
    animeIds: input.entries.map((entry) => entry.anime_id).sort(),
    rankingSeriesIds: input.rankings.map((ranking) => ranking.series_id).sort(),
  };
  return hashText(JSON.stringify(payload));
}

function formingReasonFor(
  facts: ReturnType<typeof deriveFingerprintFacts>,
): FormingReason {
  if (
    facts.startedCount < 10 ||
    facts.positiveFranchises.length < 8 ||
    facts.completedCount < 4
  ) {
    return "library";
  }
  if (facts.rankedCount < 10 || facts.confidentRankedCount < 5) {
    return "ranking";
  }
  return "library";
}

/**
 * Build a deterministic, presentation-independent taste fingerprint from
 * already-authorized profile data. No providers, database reads, or UI types
 * belong in this function.
 */
export function buildTasteFingerprint(
  input: FingerprintBuildInput,
): TasteFingerprint {
  if (input.mappingStatus === "unavailable") {
    return {
      version: FINGERPRINT_VERSION,
      inputHash: unavailableHash(input),
      state: "unavailable",
      sourceSeriesCount: 0,
      traits: [],
      formingReason: null,
    };
  }

  const normalized = normalizeFingerprintInput(input);
  const facts = deriveFingerprintFacts(
    normalized.franchises,
    normalized.rankingCount,
  );
  const candidates = evaluateFingerprintRules(facts);
  const traits = selectFingerprintTraits(candidates);
  const ready = traits.length > 0;

  return {
    version: FINGERPRINT_VERSION,
    inputHash: hashText(JSON.stringify(stableFingerprintPayload(normalized))),
    state: ready ? "ready" : "forming",
    sourceSeriesCount: facts.sourceSeriesCount,
    traits,
    formingReason: ready ? null : formingReasonFor(facts),
  };
}
