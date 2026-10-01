/** Covers the complete plain-text export contract independently of page filters. */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRankingTextExport } from "@/lib/ranking/export";

const owner = { username: "ryan", url: "https://example.com/u/ryan" };

describe("buildRankingTextExport", () => {
  it("exports every series beyond the top ten with stored ranks and canonical titles", () => {
    const rankings = Array.from({ length: 24 }, (_, index) => ({
      rank: index + 1,
      series: { canonical_title: `Series ${index + 1}` },
    })).reverse();
    const originalOrder = rankings.map((row) => row.rank);
    const result = buildRankingTextExport({ ...owner, rankings });

    assert.equal(result.text, [
      "ryan's anime ranking on Suki",
      "",
      ...Array.from({ length: 24 }, (_, index) => `${index + 1}. Series ${index + 1}`),
      "",
      owner.url,
      "",
    ].join("\n"));
    assert.equal(result.filename, "suki-ryan-ranking.txt");
    assert.equal(result.count, 24);
    assert.deepEqual(rankings.map((row) => row.rank), originalOrder);
  });

  it("keeps Unicode and punctuation, normalizes line breaks, and preserves rank gaps", () => {
    const result = buildRankingTextExport({
      ...owner,
      rankings: [
        { rank: 5, series: { canonical_title: "進撃の巨人: The Final Season" } },
        { rank: 2, series: { canonical_title: "  Steins;Gate\n  0  " } },
      ],
    });
    assert.ok(result.text.includes("2. Steins;Gate 0\n5. 進撃の巨人: The Final Season"));
  });

  it("keeps entries whose metadata is missing instead of silently truncating the export", () => {
    const result = buildRankingTextExport({
      ...owner,
      rankings: [
        { rank: 1, series: null },
        { rank: 2, series: { canonical_title: "  " } },
      ],
    });
    assert.equal(result.count, 2);
    assert.ok(result.text.includes("1. Unknown series\n2. Unknown series"));
  });

  it("reports an empty ranking so export controls can be disabled", () => {
    const result = buildRankingTextExport({ ...owner, rankings: [] });
    assert.equal(result.count, 0);
    assert.equal(result.text, `ryan's anime ranking on Suki\n\n\n${owner.url}\n`);
  });
});
