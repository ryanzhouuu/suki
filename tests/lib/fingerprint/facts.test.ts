import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  confidenceWeight,
  deriveFingerprintFacts,
  rankPositionWeight,
  rankingSignalWeight,
} from "@/lib/fingerprint/facts";
import { normalizeFingerprintInput } from "@/lib/fingerprint/normalize";

import { anime, entry, mapping, ranking, series } from "./fixtures";

describe("fingerprint facts", () => {
  it("weights higher-ranked and higher-confidence franchises more strongly", () => {
    assert.ok(rankPositionWeight(1, 10) > rankPositionWeight(4, 10));
    assert.equal(confidenceWeight("high"), 1);
    assert.ok(
      rankingSignalWeight(
        normalizeFingerprintInput({
          entries: [entry("a")],
          rankings: [ranking("series-a", 1, { confidence: "high" })],
          seriesByAnimeId: mapping([["a", series("series-a")]]),
        }).franchises[0],
        1,
      ) >
        rankingSignalWeight(
          normalizeFingerprintInput({
            entries: [entry("a")],
            rankings: [ranking("series-a", 1, { confidence: "low" })],
            seriesByAnimeId: mapping([["a", series("series-a")]]),
          }).franchises[0],
          1,
        ),
    );
  });

  it("uses all scored started franchises and excludes plan-only scores", () => {
    const normalized = normalizeFingerprintInput({
      entries: [
        entry("completed", { personal_score: 8, status: "completed" }),
        entry("watching", { personal_score: 6, status: "watching" }),
        entry("paused", { personal_score: 4, status: "paused" }),
        entry("planned", { personal_score: 10, status: "plan_to_watch" }),
      ],
      rankings: [],
      seriesByAnimeId: new Map(),
    });
    const facts = deriveFingerprintFacts(normalized.franchises, 0);

    assert.equal(facts.scoredFranchises.length, 3);
    assert.equal(facts.meanPersonalScore, 6);
  });

  it("does not treat watching franchises as failed completions", () => {
    const normalized = normalizeFingerprintInput({
      entries: [
        entry("completed", { status: "completed" }),
        entry("dropped", { status: "dropped" }),
        entry("watching", { status: "watching" }),
      ],
      rankings: [],
      seriesByAnimeId: new Map(),
    });
    const facts = deriveFingerprintFacts(normalized.franchises, 0);

    assert.equal(facts.settledCount, 2);
    assert.equal(facts.completionRate, 0.5);
    assert.equal(facts.dropShare, 1 / 3);
  });

  it("counts completed movie share by franchises with known formats", () => {
    const normalized = normalizeFingerprintInput({
      entries: [
        entry("mixed-tv", {
          anime: anime("mixed-tv", { format: "TV", episodes: 12 }),
        }),
        entry("mixed-movie", {
          anime: anime("mixed-movie", { format: "MOVIE", episodes: 1 }),
        }),
        entry("tv-only", {
          anime: anime("tv-only", { format: "TV", episodes: 24 }),
        }),
        entry("unknown-format", {
          anime: anime("unknown-format", { format: null, episodes: 12 }),
        }),
      ],
      rankings: [],
      seriesByAnimeId: mapping([
        ["mixed-tv", series("mixed")],
        ["mixed-movie", series("mixed")],
        ["tv-only", series("tv-only")],
        ["unknown-format", series("unknown")],
      ]),
    });
    const facts = deriveFingerprintFacts(normalized.franchises, 0);

    assert.equal(facts.knownCompletedFormatCount, 2);
    assert.equal(facts.completedMovieFranchises.length, 1);
    assert.equal(facts.completedFormatSignals.find((s) => s.key === "MOVIE")?.count, 1);
    assert.equal(facts.completedFormatSignals.find((s) => s.key === "TV")?.count, 2);
  });
});
