import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parsePlainText, matchPlainTextLine } from "@/lib/imports/plaintext";
import type { ImportCandidate } from "@/lib/imports/types";

describe("parsePlainText", () => {
  it("splits into trimmed, non-empty lines", () => {
    const lines = parsePlainText("  Naruto\n\nOne Piece  \n\t\nBleach");
    assert.deepEqual(lines, ["Naruto", "One Piece", "Bleach"]);
  });

  it("dedupes case-insensitively, keeping first occurrence", () => {
    const lines = parsePlainText("Naruto\nNARUTO\nBleach");
    assert.deepEqual(lines, ["Naruto", "Bleach"]);
  });
});

function candidate(
  overrides: Partial<ImportCandidate> & { title: string; anilistId: number },
): ImportCandidate {
  return { coverImageUrl: null, ...overrides };
}

describe("matchPlainTextLine", () => {
  it("auto-accepts the top hit when similarity clears 0.85", async () => {
    const search = async () => [
      candidate({ anilistId: 20, title: "Naruto" }),
      candidate({ anilistId: 1735, title: "Naruto: Shippuuden" }),
    ];
    const row = await matchPlainTextLine("naruto", search);
    assert.equal(row.matchState, "matched");
    assert.equal(row.anilistId, 20);
    assert.ok((row.similarity ?? 0) >= 0.85);
  });

  it("sends a low-confidence top hit to review with candidates", async () => {
    const search = async () => [
      candidate({ anilistId: 5114, title: "Fullmetal Alchemist: Brotherhood" }),
      candidate({ anilistId: 121, title: "Fullmetal Alchemist" }),
    ];
    const row = await matchPlainTextLine("Fullmetal Alchemist", search);
    assert.equal(row.matchState, "needs_review");
    assert.equal(row.anilistId, null);
    assert.equal(row.candidates?.length, 2);
  });

  it("marks a line unmatched when search returns nothing", async () => {
    const search = async () => [];
    const row = await matchPlainTextLine("zxqw nonexistent", search);
    assert.equal(row.matchState, "unmatched");
    assert.equal(row.anilistId, null);
  });

  it("defaults resolved rows to plan_to_watch with no score", async () => {
    const search = async () => [candidate({ anilistId: 20, title: "Naruto" })];
    const row = await matchPlainTextLine("Naruto", search);
    assert.equal(row.status, "plan_to_watch");
    assert.equal(row.personalScore, null);
    assert.equal(row.progressEpisodes, 0);
  });
});
