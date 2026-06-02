import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cosineSimilarity,
  similarityLabel,
  similarityScorePercent,
} from "@/lib/friends/cosine";

describe("cosineSimilarity", () => {
  it("returns 1 for identical unit vectors", () => {
    const v = [1, 0, 0];
    assert.equal(cosineSimilarity(v, v), 1);
  });

  it("returns 0 for orthogonal vectors", () => {
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  });

  it("returns 0 for empty or mismatched lengths", () => {
    assert.equal(cosineSimilarity([], []), 0);
    assert.equal(cosineSimilarity([1], [1, 2]), 0);
  });
});

describe("similarityScorePercent", () => {
  it("clamps and rounds to 0-100", () => {
    assert.equal(similarityScorePercent(0.876), 88);
    assert.equal(similarityScorePercent(-0.1), 0);
    assert.equal(similarityScorePercent(1.2), 100);
  });
});

describe("similarityLabel", () => {
  it("maps score bands to labels", () => {
    assert.equal(similarityLabel(90), "Very similar taste");
    assert.equal(similarityLabel(75), "Similar taste");
    assert.equal(similarityLabel(30), "Quite different");
  });
});
