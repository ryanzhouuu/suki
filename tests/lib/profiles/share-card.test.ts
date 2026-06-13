import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeRankingHash,
  isCardPublic,
  mapShareCard,
  type ShareRankingRow,
} from "@/lib/profiles/share-card";

const baseRankings: ShareRankingRow[] = [
  {
    seriesId: "s1",
    computedAt: "2026-01-01T00:00:00Z",
    coverUrl: "https://s4.anilist.co/a.jpg",
    title: "Alpha",
    genres: ["Action", "Adventure"],
  },
  {
    seriesId: "s2",
    computedAt: "2026-01-02T00:00:00Z",
    coverUrl: "https://s4.anilist.co/b.jpg",
    title: "Beta",
    genres: ["Action", "Comedy"],
  },
];

describe("isCardPublic", () => {
  it("is true only for public visibility", () => {
    assert.equal(isCardPublic("public"), true);
    assert.equal(isCardPublic("friends_only"), false);
    assert.equal(isCardPublic("private"), false);
  });
});

describe("computeRankingHash", () => {
  const input = {
    algorithmVersion: "elo_series_v1",
    computedAt: "2026-01-02T00:00:00Z",
    seriesIds: ["s1", "s2"],
  };

  it("is stable for identical input", () => {
    assert.equal(computeRankingHash(input), computeRankingHash(input));
  });

  it("changes when computedAt changes", () => {
    assert.notEqual(
      computeRankingHash(input),
      computeRankingHash({ ...input, computedAt: "2026-02-01T00:00:00Z" }),
    );
  });

  it("changes when series order changes", () => {
    assert.notEqual(
      computeRankingHash(input),
      computeRankingHash({ ...input, seriesIds: ["s2", "s1"] }),
    );
  });

  it("returns a short hex token", () => {
    assert.match(computeRankingHash(input), /^[0-9a-f]{12}$/);
  });
});

describe("mapShareCard", () => {
  const input = {
    username: "ryan",
    displayName: "Ryan",
    avatarUrl: "https://example.com/avatar.png",
    algorithmVersion: "elo_series_v1",
    completedCount: 42,
    rankings: baseRankings,
  };

  it("marks the card public and carries profile fields", () => {
    const card = mapShareCard(input);
    assert.equal(card.isPublic, true);
    assert.equal(card.username, "ryan");
    assert.equal(card.displayName, "Ryan");
    assert.equal(card.completedCount, 42);
  });

  it("maps covers preserving null cover URLs", () => {
    const card = mapShareCard({
      ...input,
      rankings: [
        baseRankings[0],
        { ...baseRankings[1], coverUrl: null },
      ],
    });
    assert.equal(card.covers.length, 2);
    assert.equal(card.covers[1].coverUrl, null);
    assert.equal(card.covers[1].title, "Beta");
  });

  it("limits covers to the top 6", () => {
    const many: ShareRankingRow[] = Array.from({ length: 10 }, (_, i) => ({
      seriesId: `s${i}`,
      computedAt: "2026-01-01T00:00:00Z",
      coverUrl: null,
      title: `T${i}`,
      genres: [],
    }));
    assert.equal(mapShareCard({ ...input, rankings: many }).covers.length, 6);
  });

  it("derives top-3 genres by frequency, deduped", () => {
    const card = mapShareCard(input);
    // Action appears twice, Adventure + Comedy once each.
    assert.equal(card.topGenres[0], "Action");
    assert.ok(card.topGenres.length <= 3);
    assert.equal(new Set(card.topGenres).size, card.topGenres.length);
  });

  it("computes a rankingHash matching computeRankingHash of its inputs", () => {
    const card = mapShareCard(input);
    assert.equal(
      card.rankingHash,
      computeRankingHash({
        algorithmVersion: "elo_series_v1",
        computedAt: "2026-01-02T00:00:00Z",
        seriesIds: ["s1", "s2"],
      }),
    );
  });
});
