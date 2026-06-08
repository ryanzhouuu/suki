import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  franchiseTitleTokens,
  pickPrimaryMedia,
  sharesFranchiseToken,
  type FranchiseMediaNode,
} from "@/lib/series/graph";

function tok(english: string | null, romaji: string | null) {
  return franchiseTitleTokens({ english, romaji, native: null });
}

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

  it("prefers TV over movie when years differ", () => {
    const primary = pickPrimaryMedia([
      node(99, "MOVIE", 2019),
      node(1, "TV", 2020),
    ]);
    assert.equal(primary.anilistId, 1);
  });
});

describe("sharesFranchiseToken", () => {
  it("links a franchise movie to its TV series", () => {
    assert.equal(
      sharesFranchiseToken(
        tok("The Quintessential Quintuplets Movie", "Go-toubun no Hanayome Movie"),
        tok("The Quintessential Quintuplets", "Go-toubun no Hanayome"),
      ),
      true,
    );
  });

  it("links a movie with a subtitle to the base TV title", () => {
    assert.equal(
      sharesFranchiseToken(
        tok("Chainsaw Man – The Movie: Reze Arc", "Chainsaw Man: Reze-hen"),
        tok("Chainsaw Man", "Chainsaw Man"),
      ),
      true,
    );
  });

  it("matches across languages via romaji", () => {
    assert.equal(
      sharesFranchiseToken(
        tok("Attack on Titan", "Shingeki no Kyojin"),
        tok(null, "Shingeki no Kyojin: Lost Girls"),
      ),
      true,
    );
  });

  it("does not bridge unrelated franchises (One Piece vs Dragon Ball)", () => {
    assert.equal(
      sharesFranchiseToken(
        tok("One Piece Film: Gold", "One Piece Film: Gold"),
        tok("Dragon Ball Z", "Dragon Ball Z"),
      ),
      false,
    );
  });

  it("does not bridge crossover specials sharing only generic words", () => {
    assert.equal(
      sharesFranchiseToken(
        tok("One Piece Film: Gold", "One Piece Film: Gold"),
        tok("Dragon Ball: Annecy Festival 60th Anniversary", null),
      ),
      false,
    );
  });
});
