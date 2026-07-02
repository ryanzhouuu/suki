import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatFuzzyDate,
  getEnabledLinks,
  getFilteredTags,
  getSortedStudios,
  getTopRankings,
  getYoutubeTrailer,
} from "@/lib/anime/detail-helpers";

describe("formatFuzzyDate", () => {
  it("formats a full date", () => {
    assert.equal(formatFuzzyDate({ year: 2020, month: 1, day: 7 }), "Jan 7 2020");
  });

  it("formats year-only date", () => {
    assert.equal(formatFuzzyDate({ year: 2020, month: null, day: null }), "2020");
  });

  it("formats month and year without day", () => {
    assert.equal(formatFuzzyDate({ year: 2020, month: 4, day: null }), "Apr 2020");
  });

  it("returns null for all-null date", () => {
    assert.equal(formatFuzzyDate({ year: null, month: null, day: null }), null);
  });

  it("returns null for null input", () => {
    assert.equal(formatFuzzyDate(null), null);
  });
});

describe("getFilteredTags", () => {
  const tags = [
    { name: "Action", rank: 90, category: "Theme", isGeneralSpoiler: false, isMediaSpoiler: false, isAdult: false },
    { name: "Romance", rank: 70, category: "Theme", isGeneralSpoiler: false, isMediaSpoiler: false, isAdult: false },
    { name: "Spoiler", rank: 85, category: "Theme", isGeneralSpoiler: true, isMediaSpoiler: false, isAdult: false },
    { name: "Media Spoiler", rank: 80, category: "Theme", isGeneralSpoiler: false, isMediaSpoiler: true, isAdult: false },
    { name: "Adult", rank: 95, category: "Theme", isGeneralSpoiler: false, isMediaSpoiler: false, isAdult: true },
  ];

  it("excludes spoiler and adult tags", () => {
    const result = getFilteredTags(tags);
    assert.deepEqual(result.map((t) => t.name), ["Action", "Romance"]);
  });

  it("sorts by rank descending", () => {
    const result = getFilteredTags([
      { name: "Low", rank: 40, category: null, isGeneralSpoiler: false, isMediaSpoiler: false, isAdult: false },
      { name: "High", rank: 80, category: null, isGeneralSpoiler: false, isMediaSpoiler: false, isAdult: false },
    ]);
    assert.equal(result[0].name, "High");
  });

  it("respects limit", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      name: `Tag${i}`,
      rank: i,
      category: null,
      isGeneralSpoiler: false,
      isMediaSpoiler: false,
      isAdult: false,
    }));
    assert.equal(getFilteredTags(many, 8).length, 8);
  });

  it("returns empty array for null input", () => {
    assert.deepEqual(getFilteredTags(null), []);
  });
});

describe("getSortedStudios", () => {
  it("puts main studios first", () => {
    const studios = {
      edges: [
        { isMain: false, node: { name: "Supporting", siteUrl: null } },
        { isMain: true, node: { name: "Main", siteUrl: null } },
      ],
    };
    const result = getSortedStudios(studios);
    assert.equal(result[0].node?.name, "Main");
  });

  it("sanitizes malicious studio siteUrls", () => {
    const studios = {
      edges: [
        { isMain: true, node: { name: "Legit", siteUrl: "https://example.com" } },
        { isMain: false, node: { name: "Malicious", siteUrl: "javascript:alert(1)" } },
      ],
    };
    const result = getSortedStudios(studios);
    assert.equal(result[0].node?.name, "Legit");
    assert.equal(result[0].node?.siteUrl, "https://example.com/");
    assert.equal(result[1].node?.name, "Malicious");
    assert.equal(result[1].node?.siteUrl, null);
  });

  it("returns empty array for null input", () => {
    assert.deepEqual(getSortedStudios(null), []);
  });
});

describe("getEnabledLinks", () => {
  it("excludes disabled links", () => {
    const links = [
      { site: "Crunchyroll", url: "https://cr.co", type: "STREAMING", language: null, isDisabled: false },
      { site: "Disabled", url: "https://x.co", type: "STREAMING", language: null, isDisabled: true },
    ];
    const result = getEnabledLinks(links);
    assert.equal(result.length, 1);
    assert.equal(result[0].site, "Crunchyroll");
  });

  it("excludes links with null url", () => {
    const links = [
      { site: "NoUrl", url: null, type: "INFO", language: null, isDisabled: false },
    ];
    assert.deepEqual(getEnabledLinks(links), []);
  });

  it("filters out javascript: URLs from malicious metadata", () => {
    const links = [
      { site: "Legit", url: "https://example.com", type: "INFO", language: null, isDisabled: false },
      { site: "Malicious", url: "javascript:alert(1)", type: "INFO", language: null, isDisabled: false },
    ];
    const result = getEnabledLinks(links);
    assert.equal(result.length, 1);
    assert.equal(result[0].site, "Legit");
  });

  it("returns empty array for null input", () => {
    assert.deepEqual(getEnabledLinks(null), []);
  });
});

describe("getTopRankings", () => {
  it("returns only allTime rankings", () => {
    const rankings = [
      { rank: 1, type: "RATED", allTime: true, context: "highest rated all time" },
      { rank: 10, type: "RATED", allTime: false, context: "highest rated this year" },
    ];
    const result = getTopRankings(rankings);
    assert.equal(result.length, 1);
    assert.equal(result[0].rank, 1);
  });

  it("caps at 3", () => {
    const rankings = Array.from({ length: 5 }, (_, i) => ({
      rank: i + 1,
      type: "RATED",
      allTime: true,
      context: "context",
    }));
    assert.equal(getTopRankings(rankings).length, 3);
  });
});

describe("getYoutubeTrailer", () => {
  it("returns trailer when site is youtube and id exists", () => {
    const t = { id: "abc", site: "youtube", thumbnail: "https://img.youtube.com/vi/abc/0.jpg" };
    assert.deepEqual(getYoutubeTrailer(t), t);
  });

  it("returns null when site is not youtube", () => {
    assert.equal(getYoutubeTrailer({ id: "abc", site: "dailymotion", thumbnail: null }), null);
  });

  it("returns null when id is null", () => {
    assert.equal(getYoutubeTrailer({ id: null, site: "youtube", thumbnail: null }), null);
  });

  it("returns null for null input", () => {
    assert.equal(getYoutubeTrailer(null), null);
  });
});
