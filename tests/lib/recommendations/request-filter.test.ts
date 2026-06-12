import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  filterCandidatesByRequest,
  matchesLengthBucket,
  matchesRequestPrefs,
} from "@/lib/recommendations/request-filter";
import type { RecommendationRequestPrefs } from "@/lib/recommendations/request-prefs";

function anime(
  overrides: Partial<{
    genres: string[];
    format: string | null;
    episodes: number | null;
  }> = {},
) {
  return {
    genres: ["Action"],
    format: "TV" as string | null,
    episodes: 12 as number | null,
    ...overrides,
  };
}

describe("matchesLengthBucket", () => {
  it("identifies movies", () => {
    assert.ok(matchesLengthBucket(anime({ format: "MOVIE", episodes: 1 }), "movie"));
  });

  it("identifies short series", () => {
    assert.ok(matchesLengthBucket(anime({ format: "TV", episodes: 12 }), "short"));
    assert.ok(matchesLengthBucket(anime({ format: "TV_SHORT", episodes: null }), "short"));
  });

  it("identifies long series", () => {
    assert.ok(matchesLengthBucket(anime({ format: "TV", episodes: 50 }), "long"));
  });
});

describe("filterCandidatesByRequest", () => {
  it("filters by genre include", () => {
    const prefs: RecommendationRequestPrefs = {
      genres: ["Horror"],
      lengthBucket: null,
      format: null,
      mood: null,
      adventurousness: "balanced",
    };
    const items = [
      anime({ genres: ["Horror"] }),
      anime({ genres: ["Comedy"] }),
    ];
    const filtered = filterCandidatesByRequest(items, prefs);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].genres[0], "Horror");
  });

  it("passes all when prefs empty", () => {
    const items = [anime(), anime({ genres: ["Sports"] })];
    assert.equal(
      filterCandidatesByRequest(items, {
        genres: [],
        lengthBucket: null,
        format: null,
        mood: null,
        adventurousness: "balanced",
      }).length,
      2,
    );
  });
});

describe("matchesRequestPrefs", () => {
  it("requires format when specified", () => {
    assert.ok(
      matchesRequestPrefs(anime({ format: "OVA" }), {
        genres: [],
        lengthBucket: null,
        format: "OVA",
        mood: null,
        adventurousness: "balanced",
      }),
    );
    assert.ok(
      !matchesRequestPrefs(anime({ format: "TV" }), {
        genres: [],
        lengthBucket: null,
        format: "OVA",
        mood: null,
        adventurousness: "balanced",
      }),
    );
  });
});
