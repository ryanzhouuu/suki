import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickSeriesBanner } from "@/lib/series/banner";

describe("pickSeriesBanner", () => {
  const members = [
    { anilistId: 1, bannerUrl: null },
    { anilistId: 2, bannerUrl: "https://cdn/primary.jpg" },
    { anilistId: 3, bannerUrl: "https://cdn/other.jpg" },
  ];

  it("prefers the primary entry's banner", () => {
    assert.equal(pickSeriesBanner(2, members, "https://cdn/cover.jpg"), "https://cdn/primary.jpg");
  });

  it("falls back to any member banner, then the series cover", () => {
    assert.equal(
      pickSeriesBanner(
        1,
        [
          { anilistId: 1, bannerUrl: null },
          { anilistId: 3, bannerUrl: "https://cdn/other.jpg" },
        ],
        "https://cdn/cover.jpg",
      ),
      "https://cdn/other.jpg",
    );
    assert.equal(
      pickSeriesBanner(9, [{ anilistId: 9, bannerUrl: null }], "https://cdn/cover.jpg"),
      "https://cdn/cover.jpg",
    );
    assert.equal(pickSeriesBanner(9, [], null), null);
  });
});
