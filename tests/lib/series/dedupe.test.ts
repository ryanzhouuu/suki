import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planDuplicateMerges, type SeriesLite } from "@/lib/series/dedupe";

function counts(entries: [string, number][]): Map<string, number> {
  return new Map(entries);
}

describe("planDuplicateMerges", () => {
  it("merges season-suffixed rows into the one with the most members", () => {
    const series: SeriesLite[] = [
      { id: "a", canonical_title: "HAIKYU!!", anilist_primary_id: 20583 },
      { id: "b", canonical_title: "HAIKYU!! 2nd Season", anilist_primary_id: 20834 },
      { id: "c", canonical_title: "HAIKYU!! 3rd Season", anilist_primary_id: 21701 },
    ];
    const plans = planDuplicateMerges(
      series,
      counts([
        ["a", 3],
        ["b", 1],
        ["c", 1],
      ]),
    );
    assert.equal(plans.length, 1);
    assert.equal(plans[0].survivorId, "a");
    assert.deepEqual([...plans[0].loserIds].sort(), ["b", "c"]);
  });

  it("breaks member-count ties by lowest anilist_primary_id", () => {
    const series: SeriesLite[] = [
      { id: "hi", canonical_title: "ONE PIECE", anilist_primary_id: 999 },
      { id: "lo", canonical_title: "One Piece", anilist_primary_id: 21 },
    ];
    const plans = planDuplicateMerges(series, counts([["hi", 1], ["lo", 1]]));
    assert.equal(plans.length, 1);
    assert.equal(plans[0].survivorId, "lo");
    assert.deepEqual(plans[0].loserIds, ["hi"]);
  });

  it("does not merge unrelated franchises", () => {
    const series: SeriesLite[] = [
      { id: "a", canonical_title: "Naruto", anilist_primary_id: 20 },
      { id: "b", canonical_title: "One Piece", anilist_primary_id: 21 },
      { id: "c", canonical_title: "Fate/Zero", anilist_primary_id: 10087 },
    ];
    const plans = planDuplicateMerges(
      series,
      counts([["a", 1], ["b", 1], ["c", 1]]),
    );
    assert.equal(plans.length, 0);
  });

  it("groups colon-subtitle variants with the base franchise", () => {
    const series: SeriesLite[] = [
      { id: "base", canonical_title: "Black Clover", anilist_primary_id: 97940 },
      {
        id: "movie",
        canonical_title: "Black Clover: Sword of the Wizard King",
        anilist_primary_id: 153406,
      },
    ];
    const plans = planDuplicateMerges(
      series,
      counts([["base", 4], ["movie", 1]]),
    );
    assert.equal(plans.length, 1);
    assert.equal(plans[0].survivorId, "base");
    assert.deepEqual(plans[0].loserIds, ["movie"]);
  });
});
