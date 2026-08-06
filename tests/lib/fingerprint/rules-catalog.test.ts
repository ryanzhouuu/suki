import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FINGERPRINT_RULES,
  evaluateFingerprintRules,
  type FingerprintRule,
} from "@/lib/fingerprint/rules";
import {
  FINGERPRINT_TRAIT_IDS,
  buildTasteFingerprint,
} from "@/lib/fingerprint";

import { anime, entry, rankedProfile, ranking, series } from "./fixtures";
import { factsFor } from "./rule-fixtures";

describe("fingerprint rule catalog", () => {
  it("keeps IDs stable and returns only valid trait IDs", () => {
    assert.deepEqual(
      FINGERPRINT_RULES.map((rule) => rule.id),
      [...FINGERPRINT_TRAIT_IDS],
    );
    const candidates = evaluateFingerprintRules(factsFor(rankedProfile()));
    assert.ok(
      candidates.every((candidate) => FINGERPRINT_TRAIT_IDS.includes(candidate.id)),
    );
  });

  it("qualifies genre devotion exactly at its minimum", () => {
    const below = buildTasteFingerprint(rankedProfile({ count: 7 }));
    const exact = buildTasteFingerprint(rankedProfile({ count: 8 }));
    assert.equal(below.traits.some((trait) => trait.id === "genre-devotee"), false);
    assert.equal(exact.traits.some((trait) => trait.id === "genre-devotee"), true);
    assert.equal(
      exact.traits.find((trait) => trait.id === "genre-devotee")?.label,
      "Action Loyalist",
    );
  });

  it("uses only curated tag clusters for Theme Magnet", () => {
    const tag = (name: string) => ({
      name,
      isAdult: false,
      isGeneralSpoiler: false,
      isMediaSpoiler: false,
    });
    const unapproved = rankedProfile({ count: 6, tags: [tag("Made-Up Theme")] });
    const curated = rankedProfile({ count: 6, tags: [tag("Time Travel")] });
    assert.equal(
      buildTasteFingerprint(unapproved).traits.some((item) => item.id === "theme-magnet"),
      false,
    );
    const trait = buildTasteFingerprint(curated).traits.find(
      (item) => item.id === "theme-magnet",
    );
    assert.equal(trait?.label, "Timeline Tinkerer");
  });

  it("isolates an unexpected rule failure", () => {
    const healthy = FINGERPRINT_RULES.find(
      (rule) => rule.id === "completion-machine",
    );
    assert.ok(healthy);
    const throwing: FingerprintRule = {
      ...healthy,
      id: "battle-tested-favorites",
      evaluate() {
        throw new Error("synthetic rule failure");
      },
    };
    const candidates = evaluateFingerprintRules(factsFor(rankedProfile()), [
      throwing,
      healthy,
    ]);
    assert.deepEqual(candidates.map((candidate) => candidate.id), [
      "completion-machine",
    ]);
  });

  it("uses explicit user-count wording for popularity evidence", () => {
    const trait = buildTasteFingerprint(
      rankedProfile({ count: 6, popularity: 1_000 }),
    ).traits.find((item) => item.id === "deep-cut-devotee");
    assert.ok(trait);
    assert.match(trait.evidence[0].text, /AniList users/);
    assert.doesNotMatch(trait.evidence[0].text, /AniList popularity\./);
  });

  it("supports all scored started statuses for rating rules", () => {
    const entries = Array.from({ length: 8 }, (_, index) =>
      entry(`scored-${index}`, {
        status: index === 0 ? "watching" : "completed",
        personal_score: 6,
        anime: anime(`scored-${index}`, { genres: ["Drama"] }),
      }),
    );
    const pairs = entries.map(
      (item, index) => [item.anime_id, series(`scored-series-${index}`)] as const,
    );
    const rankings = entries.map((_, index) =>
      ranking(`scored-series-${index}`, index + 1),
    );
    const fingerprint = buildTasteFingerprint({
      entries,
      rankings,
      seriesByAnimeId: new Map(pairs),
    });
    assert.ok(fingerprint.traits.some((trait) => trait.id === "reserved-applause"));
  });
});
