import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isValidAniListGenre,
  MAX_SEARCH_GENRES,
  normalizeGenreParams,
} from "@/lib/anilist/genres";

describe("isValidAniListGenre", () => {
  it("accepts canonical genres", () => {
    assert.equal(isValidAniListGenre("Action"), true);
    assert.equal(isValidAniListGenre("Sci-Fi"), true);
  });

  it("rejects unknown genres", () => {
    assert.equal(isValidAniListGenre("Western"), false);
  });
});

describe("normalizeGenreParams", () => {
  it("dedupes and trims valid genres", () => {
    assert.deepEqual(
      normalizeGenreParams([" Action ", "Action", "Comedy", "  ", "Nope"]),
      ["Action", "Comedy"],
    );
  });
});

describe("MAX_SEARCH_GENRES", () => {
  it("is 4", () => {
    assert.equal(MAX_SEARCH_GENRES, 4);
  });
});
