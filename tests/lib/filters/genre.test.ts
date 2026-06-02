import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterByGenre,
  genreFilterKey,
  matchesAnyGenre,
} from "@/lib/filters/genre";

describe("matchesAnyGenre", () => {
  it("passes when no genres selected", () => {
    assert.equal(matchesAnyGenre(["Action"], []), true);
  });

  it("matches any selected genre", () => {
    assert.equal(matchesAnyGenre(["Action", "Drama"], ["Comedy", "Drama"]), true);
    assert.equal(matchesAnyGenre(["Action"], ["Comedy"]), false);
  });
});

describe("genreFilterKey", () => {
  it("joins genres with null separator", () => {
    assert.equal(genreFilterKey(["Action", "Drama"]), "Action\0Drama");
  });
});

describe("filterByGenre", () => {
  it("filters items by genre getter", () => {
    const items = [
      { id: "1", genres: ["Action"] },
      { id: "2", genres: ["Comedy"] },
    ];
    const result = filterByGenre(items, ["Action"], (i) => i.genres);
    assert.deepEqual(result.map((i) => i.id), ["1"]);
  });
});
