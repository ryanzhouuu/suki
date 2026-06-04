import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseExplanationDetails } from "@/lib/recommendations/explanation-details";

describe("parseExplanationDetails", () => {
  it("returns stored details when present", () => {
    const parsed = parseExplanationDetails(
      {
        primaryReason: "Because you like Action.",
        secondarySignals: ["Strong semantic match with your ranked favorites."],
        matchedGenres: ["Action"],
        anchorTitles: ["Top"],
        badges: ["genre_match"],
      },
      "Fallback",
    );

    assert.equal(parsed.primaryReason, "Because you like Action.");
    assert.equal(parsed.matchedGenres[0], "Action");
    assert.equal(parsed.badges[0], "genre_match");
  });

  it("falls back when details are empty", () => {
    const parsed = parseExplanationDetails({}, "Fallback explanation");
    assert.equal(parsed.primaryReason, "Fallback explanation");
    assert.deepEqual(parsed.secondarySignals, []);
  });
});
