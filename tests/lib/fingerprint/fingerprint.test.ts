import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FINGERPRINT_TRAIT_IDS,
  FINGERPRINT_VERSION,
  buildTasteFingerprint,
} from "@/lib/fingerprint";

import { anime, entry, rankedProfile, series } from "./fixtures";

function ids(fingerprint: ReturnType<typeof buildTasteFingerprint>): string[] {
  return fingerprint.traits.map((trait) => trait.id);
}

describe("buildTasteFingerprint", () => {
  it("returns a first-class forming library state for a newcomer", () => {
    const fingerprint = buildTasteFingerprint({
      entries: [],
      rankings: [],
      seriesByAnimeId: new Map(),
    });

    assert.equal(fingerprint.version, FINGERPRINT_VERSION);
    assert.equal(fingerprint.state, "forming");
    assert.equal(fingerprint.formingReason, "library");
    assert.deepEqual(fingerprint.traits, []);
  });

  it("returns a ranking deficit when library activity is sufficient but ranking data is thin", () => {
    const input = rankedProfile({
      count: 12,
      episodes: null,
      score: null,
      statuses: [
        "completed",
        "completed",
        "completed",
        "completed",
        "completed",
        "completed",
        "completed",
        "watching",
        "watching",
        "watching",
        "plan_to_watch",
        "plan_to_watch",
      ],
    });
    input.rankings.length = 0;
    input.entries.forEach((item) => {
      item.anime.genres = [];
    });
    const fingerprint = buildTasteFingerprint(input);

    assert.equal(fingerprint.state, "forming");
    assert.equal(fingerprint.formingReason, "ranking");
  });

  it("produces a credible niche-fan constellation", () => {
    const fingerprint = buildTasteFingerprint(
      rankedProfile({ count: 12, popularity: 1_000, genre: "Mystery" }),
    );

    assert.equal(fingerprint.state, "ready");
    assert.ok(ids(fingerprint).includes("genre-devotee"));
    assert.ok(ids(fingerprint).includes("deep-cut-devotee"));
    assert.equal(ids(fingerprint).includes("focused-specialist"), false);
    assert.ok(fingerprint.traits.every((trait) => trait.evidence.length >= 2));
  });

  it("produces a crowd-pleaser trait for high-popularity favorites", () => {
    const fingerprint = buildTasteFingerprint(
      rankedProfile({ count: 12, popularity: 250_000, genre: "Comedy" }),
    );

    assert.equal(fingerprint.state, "ready");
    assert.ok(ids(fingerprint).includes("certified-crowd-pleaser"));
    assert.ok(
      fingerprint.traits
        .flatMap((trait) => trait.evidence)
        .some((item) => /AniList users/.test(item.text)),
    );
  });

  it("recognizes completion-focused behavior", () => {
    const fingerprint = buildTasteFingerprint(
      rankedProfile({ count: 12, genre: "Drama" }),
    );

    assert.ok(ids(fingerprint).includes("completion-machine"));
  });

  it("recognizes a serial sampler without using a shaming label", () => {
    const statuses = [
      "paused",
      "dropped",
      "paused",
      "dropped",
      "paused",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
    ] as const;
    const input = rankedProfile({ count: 12, episodes: 20, score: null, statuses });
    input.rankings.length = 0;
    input.entries.forEach((item, index) => {
      item.anime.genres = [["Action"], ["Drama"], ["Comedy"], ["Fantasy"]][index % 4];
    });
    const fingerprint = buildTasteFingerprint(input);

    assert.ok(ids(fingerprint).includes("serial-sampler"));
    assert.ok(
      fingerprint.traits.every((trait) => !/Quitter/i.test(`${trait.label} ${trait.summary}`)),
    );
  });

  it("recognizes short and long completion profiles", () => {
    const shortFingerprint = buildTasteFingerprint(
      rankedProfile({ count: 6, episodes: 12, score: null }),
    );
    const longFingerprint = buildTasteFingerprint(
      rankedProfile({ count: 6, episodes: 50, score: null }),
    );

    assert.ok(ids(shortFingerprint).includes("short-form-loyalist"));
    assert.ok(ids(longFingerprint).includes("long-haul-legend"));
  });

  it("recognizes eclectic and focused profiles", () => {
    const eclectic = rankedProfile({ count: 12, episodes: null, score: null });
    eclectic.rankings.length = 0;
    eclectic.entries.forEach((item, index) => {
      item.anime.genres = [`genre-${index}`];
    });
    const focused = rankedProfile({ count: 10, genre: "Romance", episodes: null, score: null });
    focused.rankings.length = 0;

    assert.ok(ids(buildTasteFingerprint(eclectic)).includes("eclectic-explorer"));
    assert.ok(ids(buildTasteFingerprint(focused)).includes("focused-specialist"));
  });

  it("recognizes repeated viewing across multiple franchises", () => {
    const input = rankedProfile({ count: 6, episodes: 20, score: null });
    input.rankings.length = 0;
    input.entries[0].rewatch_count = 2;
    input.entries[1].rewatch_count = 2;
    const fingerprint = buildTasteFingerprint(input);

    assert.ok(ids(fingerprint).includes("rewatch-ritualist"));
  });

  it("does not double-count a multi-season franchise", () => {
    const entries = [
      entry("season-1", { personal_score: null, anime: anime("season-1", { genres: ["Action"] }) }),
      entry("season-2", { personal_score: null, anime: anime("season-2", { genres: ["Action"] }) }),
      ...Array.from({ length: 7 }, (_, index) =>
        entry(`other-${index}`, {
          personal_score: null,
          anime: anime(`other-${index}`, { genres: ["Drama"] }),
        }),
      ),
    ];
    const pairs = [
      ["season-1", series("shared", "Shared")],
      ["season-2", series("shared", "Shared")],
      ...Array.from({ length: 7 }, (_, index) => [
        `other-${index}`,
        series(`other-series-${index}`),
      ] as const),
    ] as const;
    const fingerprint = buildTasteFingerprint({
      entries,
      rankings: [],
      seriesByAnimeId: new Map(pairs),
    });

    assert.equal(fingerprint.sourceSeriesCount, 8);
  });

  it("keeps mapping failure distinct from sparse data", () => {
    const fingerprint = buildTasteFingerprint({
      ...rankedProfile({ count: 10 }),
      mappingStatus: "unavailable",
    });

    assert.equal(fingerprint.state, "unavailable");
    assert.equal(fingerprint.formingReason, null);
    assert.deepEqual(fingerprint.traits, []);
  });

  it("is byte-equivalent for shuffled input and map insertion order", () => {
    const input = rankedProfile({ count: 12, genre: "Fantasy" });
    const shuffled = {
      entries: [...input.entries].reverse(),
      rankings: [...input.rankings].reverse(),
      seriesByAnimeId: new Map([...input.seriesByAnimeId.entries()].reverse()),
    };
    const first = buildTasteFingerprint(input);
    const second = buildTasteFingerprint(shuffled);

    assert.deepEqual(second, first);
    assert.equal(second.inputHash, first.inputHash);
  });

  it("exposes the complete analytics validation ID set", () => {
    const fingerprint = buildTasteFingerprint(rankedProfile({ count: 12 }));
    assert.ok(fingerprint.traits.every((trait) => FINGERPRINT_TRAIT_IDS.includes(trait.id)));
  });
});
