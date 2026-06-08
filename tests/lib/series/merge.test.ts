import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { FranchiseMediaNode } from "@/lib/series/graph";
import { franchiseRootForCluster } from "@/lib/series/merge";

function node(
  english: string,
  format: string | null = "TV",
): FranchiseMediaNode {
  return {
    anilistId: Math.floor(Math.random() * 100000),
    format,
    seasonYear: 2011,
    title: { english, romaji: english, native: null },
    coverImageUrl: null,
  };
}

describe("franchiseRootForCluster", () => {
  it("ignores MUSIC entries and prefers the show the user added", () => {
    const root = franchiseRootForCluster(
      [
        node("Just Awake", "MUSIC"),
        node("Hunter x Hunter (2011)", "TV"),
        node("Hunter x Hunter", "TV"),
      ],
      "Hunter x Hunter",
    );
    assert.equal(root, "Hunter x Hunter");
  });

  it("prefers fallback root when cluster disagrees with a lone outlier", () => {
    const root = franchiseRootForCluster(
      [node("Spy x Family"), node("Spy x Family Season 2")],
      "Spy x Family",
    );
    assert.equal(root, "Spy x Family");
  });

  it("groups a franchise movie under the TV series root", () => {
    // Resolving from the movie: the cluster reaches the TV seasons, so the
    // movie must consolidate into the franchise, not its own title.
    const root = franchiseRootForCluster(
      [
        node("The Quintessential Quintuplets Movie", "MOVIE"),
        node("The Quintessential Quintuplets Specials", "SPECIAL"),
        node("The Quintessential Quintuplets 2", "TV"),
        node("The Quintessential Quintuplets", "TV"),
      ],
      "The Quintessential Quintuplets Movie",
    );
    assert.equal(root, "The Quintessential Quintuplets");
  });

  it("groups a single-season franchise movie under the TV title", () => {
    const root = franchiseRootForCluster(
      [
        node("Chainsaw Man – The Movie: Reze Arc", "MOVIE"),
        node("Chainsaw Man", "TV"),
        node("Chainsaw Man: Shikaku-hen", null),
        node("Chainsaw Days", "ONA"),
      ],
      "Chainsaw Man – The Movie: Reze Arc",
    );
    assert.equal(root, "Chainsaw Man");
  });

  it("lets the TV run name the franchise over duplicated movie/special pairs", () => {
    const tv: FranchiseMediaNode = {
      anilistId: 1,
      format: "TV",
      seasonYear: 1999,
      title: { english: "ONE PIECE", romaji: "One Piece", native: null },
      coverImageUrl: null,
    };
    // A movie and its TV-special recut share a romaji title, so frequency alone
    // would let the Alabasta pair (count 2) outvote the single main TV.
    const alabasta = (
      id: number,
      format: string,
      english: string,
    ): FranchiseMediaNode => ({
      anilistId: id,
      format,
      seasonYear: 2007,
      title: {
        english,
        romaji: "One Piece: Episode of Alabasta - Sabaku no Oujo to Kaizoku-tachi",
        native: null,
      },
      coverImageUrl: null,
    });

    const root = franchiseRootForCluster(
      [
        alabasta(
          2,
          "MOVIE",
          "One Piece: The Desert Princess and the Pirates, Adventures in Alabasta",
        ),
        alabasta(
          3,
          "SPECIAL",
          "One Piece: Episode of Alabasta - The Desert Princess and the Pirates",
        ),
        tv,
      ],
      "One Piece Film: Gold",
    );
    assert.equal(root, "ONE PIECE");
  });
});
