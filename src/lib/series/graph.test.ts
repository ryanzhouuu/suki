import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickPrimaryMedia, type FranchiseMediaNode } from "./graph";

function node(
  id: number,
  format: string | null,
  year: number | null,
): FranchiseMediaNode {
  return {
    anilistId: id,
    format,
    seasonYear: year,
    title: { romaji: `Anime ${id}`, english: null, native: null },
    coverImageUrl: null,
  };
}

describe("pickPrimaryMedia", () => {
  it("prefers earliest TV season as franchise primary", () => {
    const primary = pickPrimaryMedia([
      node(3, "TV", 2025),
      node(1, "TV", 2020),
      node(2, "MOVIE", 2021),
    ]);
    assert.equal(primary.anilistId, 1);
  });

  it("uses lowest id when format and year tie", () => {
    const primary = pickPrimaryMedia([node(10, "OVA", 2022), node(5, "OVA", 2022)]);
    assert.equal(primary.anilistId, 5);
  });
});
