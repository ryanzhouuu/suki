import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickTrendingFeature, toDiscoverItem, type DiscoverAnimeItem } from "@/lib/anilist/discover";
import type { AniListDiscoverMedia } from "@/lib/anilist/types";

function item(overrides: Partial<DiscoverAnimeItem> = {}): DiscoverAnimeItem {
  return {
    anilistId: 1,
    title: "One",
    coverUrl: null,
    bannerUrl: null,
    studio: null,
    format: "TV",
    seasonYear: 2024,
    ...overrides,
  };
}

describe("toDiscoverItem", () => {
  it("carries banner art and the first named studio", () => {
    const mapped = toDiscoverItem({
      id: 21,
      title: { english: "DAN DA DAN", romaji: "Dandadan", native: null },
      coverImage: { large: "https://cdn/cover.jpg" },
      bannerImage: "https://cdn/banner.jpg",
      studios: { nodes: [null, { name: "Science SARU" }] },
      format: "TV",
      seasonYear: 2024,
    } as AniListDiscoverMedia);
    assert.equal(mapped.bannerUrl, "https://cdn/banner.jpg");
    assert.equal(mapped.studio, "Science SARU");
    assert.equal(mapped.title, "DAN DA DAN");
  });
});

describe("pickTrendingFeature", () => {
  it("picks the highest-trending item that has banner art and keeps its rank", () => {
    const feature = pickTrendingFeature([
      item({ anilistId: 1, bannerUrl: null }),
      item({ anilistId: 2, title: "Second", bannerUrl: "https://cdn/banner.jpg" }),
    ]);
    assert.equal(feature?.anilistId, 2);
    assert.equal(feature?.rank, 2);
    assert.equal(feature?.bannerUrl, "https://cdn/banner.jpg");
  });

  it("returns null when nothing has a banner", () => {
    assert.equal(pickTrendingFeature([item(), item({ anilistId: 2 })]), null);
    assert.equal(pickTrendingFeature([]), null);
  });
});
