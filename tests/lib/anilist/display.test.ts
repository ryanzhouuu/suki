import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getAniListDisplayTitle, stripHtml } from "@/lib/anilist/display";

describe("getAniListDisplayTitle", () => {
  it("prefers english then romaji then native", () => {
    assert.equal(
      getAniListDisplayTitle({
        english: "English",
        romaji: "Romaji",
        native: "Native",
      }),
      "English",
    );
    assert.equal(
      getAniListDisplayTitle({ english: null, romaji: "R", native: "N" }),
      "R",
    );
    assert.equal(
      getAniListDisplayTitle({ english: null, romaji: null, native: null }),
      "Unknown",
    );
  });
});

describe("stripHtml", () => {
  it("removes tags and trims", () => {
    assert.equal(stripHtml("<p>Hello</p>"), "Hello");
    assert.equal(stripHtml(null), "");
  });
});
