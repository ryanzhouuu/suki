import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSearchParams } from "./params";

describe("parseSearchParams", () => {
  it("parses query and valid genres", () => {
    const params = new URLSearchParams({
      q: "one piece",
      genre: "Action",
    });
    params.append("genre", "Comedy");

    const parsed = parseSearchParams(params);
    assert.equal(parsed.query, "one piece");
    assert.deepEqual(parsed.genres, ["Action", "Comedy"]);
    assert.equal(parsed.invalidGenre, null);
  });

  it("flags invalid genre", () => {
    const params = new URLSearchParams({ genre: "NotARealGenre" });
    assert.equal(parseSearchParams(params).invalidGenre, "NotARealGenre");
  });

  it("dedupes genres and caps count", () => {
    const params = new URLSearchParams();
    for (const g of ["Action", "Action", "Comedy", "Drama", "Fantasy", "Horror"]) {
      params.append("genre", g);
    }
    const parsed = parseSearchParams(params);
    assert.equal(parsed.genres.length, 4);
    assert.equal(parsed.invalidGenre, null);
  });
});
