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
});
