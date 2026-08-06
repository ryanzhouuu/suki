import { RULE_THRESHOLDS } from "./rule-config";
import { candidate, clamp01, evidence, titleList } from "./rule-helpers";
import type { FingerprintRule } from "./rule-types";

export const completionMachineRule: FingerprintRule = {
  id: "completion-machine",
  family: "behavior",
  label: "Completion Machine",
  summary: "Once you start a franchise, you usually see it through.",
  editorialPriority: 18,
  opposingTraitIds: ["serial-sampler"],
  evaluate(facts) {
    if (
      facts.startedCount < RULE_THRESHOLDS.completionMinimumStarted ||
      facts.settledCount < RULE_THRESHOLDS.completionMinimumSettled ||
      facts.completionRate === null ||
      facts.completionRate < RULE_THRESHOLDS.completionMinimumRate ||
      facts.dropShare > RULE_THRESHOLDS.completionMaximumDropShare
    ) {
      return null;
    }
    return candidate(
      completionMachineRule,
      clamp01((facts.completionRate + (1 - facts.dropShare)) / 2),
      [
        evidence(
          "completion-rate",
          `${Math.round(facts.completionRate * 100)}% of ${facts.settledCount} settled franchises are completed.`,
          {
            value: facts.completedFranchises.filter((item) => item.isSettled)
              .length,
            denominator: facts.settledCount,
          },
        ),
        evidence(
          "started-count",
          `The pattern comes from ${facts.startedCount} started franchises, with ${facts.droppedCount} dropped.`,
          { value: facts.startedCount, denominator: facts.startedCount },
        ),
      ],
    );
  },
};

export const serialSamplerRule: FingerprintRule = {
  id: "serial-sampler",
  family: "behavior",
  label: "Serial Sampler",
  summary: "You like trying new worlds, even when not every visit becomes a long stay.",
  editorialPriority: 17,
  opposingTraitIds: ["completion-machine"],
  evaluate(facts) {
    const pausedOrDropped = facts.startedFranchises.filter(
      (item) => item.hasPaused || item.hasDropped,
    ).length;
    if (
      facts.startedCount < RULE_THRESHOLDS.samplerMinimumStarted ||
      pausedOrDropped < RULE_THRESHOLDS.samplerMinimumPausedOrDropped ||
      facts.pauseDropShare < RULE_THRESHOLDS.samplerMinimumShare
    ) {
      return null;
    }
    return candidate(
      serialSamplerRule,
      clamp01(
        facts.pauseDropShare * 0.7 +
          (pausedOrDropped / facts.startedCount) * 0.3,
      ),
      [
        evidence(
          "pause-drop-share",
          `${pausedOrDropped} of ${facts.startedCount} started franchises are paused or dropped.`,
          { value: pausedOrDropped, denominator: facts.startedCount },
        ),
        evidence(
          "sampling-pattern",
          `Your library contains ${facts.completedCount} completed, ${facts.pausedCount} paused, and ${facts.droppedCount} dropped franchises.`,
          { value: facts.completedCount, denominator: facts.startedCount },
        ),
      ],
    );
  },
};

export const rewatchRitualistRule: FingerprintRule = {
  id: "rewatch-ritualist",
  family: "behavior",
  label: "Rewatch Ritualist",
  summary: "Some favorites are not one-time visits in your library.",
  editorialPriority: 16,
  evaluate(facts) {
    if (
      facts.totalRewatchCount < RULE_THRESHOLDS.rewatchMinimumTotal ||
      facts.rewatchedFranchiseCount < RULE_THRESHOLDS.rewatchMinimumFranchises
    ) {
      return null;
    }
    const names = titleList(facts, (item) => item.hasRewatch);
    return candidate(
      rewatchRitualistRule,
      clamp01(
        (facts.totalRewatchCount / 10) * 0.5 +
          (facts.rewatchedFranchiseCount / facts.startedCount) * 0.5,
      ),
      [
        evidence(
          "rewatch-count",
          `${facts.totalRewatchCount} rewatches are spread across ${facts.rewatchedFranchiseCount} franchises.`,
          {
            value: facts.totalRewatchCount,
            denominator: facts.rewatchedFranchiseCount,
          },
        ),
        evidence("rewatch-titles", `Repeat visits include ${names.titles}.`, {
          seriesIds: names.ids,
        }),
      ],
    );
  },
};

export const behaviorRules = [
  completionMachineRule,
  serialSamplerRule,
  rewatchRitualistRule,
] as const;
