import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cleanDescription,
  completedCredit,
  formatEpisodeCredit,
  MAX_HERO_SHOWS,
  orderHeroShows,
  remainingEpisodes,
  resolveActiveShow,
  selectHeroShows,
  titleCredit,
  trackingCredit,
  type HeroShow,
} from "@/lib/home/featured";
import type { LibraryEntry } from "@/lib/library/queries";

function entry(overrides: {
  id?: string;
  progress?: number;
  banner?: string | null;
  title?: string;
  episodes?: number | null;
  studio?: string | null;
  year?: number | null;
  description?: string | null;
}): LibraryEntry {
  return {
    id: overrides.id ?? "entry-1",
    progress_episodes: overrides.progress ?? 14,
    anime: {
      anilist_id: 154587,
      banner_image_url: overrides.banner === undefined ? "https://cdn/banner.jpg" : overrides.banner,
      english_title: overrides.title ?? "Frieren",
      romaji_title: "Sousou no Frieren",
      native_title: null,
      description: overrides.description === undefined ? "<p>Hello<br>there &amp; friends</p>" : overrides.description,
      episodes: overrides.episodes === undefined ? 28 : overrides.episodes,
      season_year: overrides.year === undefined ? 2023 : overrides.year,
      studios:
        overrides.studio === undefined
          ? { edges: [{ isMain: true, node: { name: "Madhouse", siteUrl: null } }] }
          : overrides.studio
            ? { edges: [{ isMain: true, node: { name: overrides.studio, siteUrl: null } }] }
            : null,
    },
  } as unknown as LibraryEntry;
}

function show(overrides: Partial<HeroShow> = {}): HeroShow {
  return {
    entryId: "entry-1",
    anilistId: 1,
    title: "Frieren",
    bannerUrl: "https://cdn/banner.jpg",
    description: "Hello there",
    progressEpisodes: 14,
    totalEpisodes: 28,
    studio: "Madhouse",
    seasonYear: 2023,
    ...overrides,
  };
}

describe("selectHeroShows", () => {
  it("keeps bannered shows in the given order and skips missing art", () => {
    const shows = selectHeroShows([
      entry({ id: "no-art", banner: null, title: "Skip" }),
      entry({ id: "first", title: "Frieren" }),
      entry({ id: "second", title: "Dungeon" }),
    ]);
    assert.deepEqual(
      shows.map((item) => item.entryId),
      ["first", "second"],
    );
    assert.equal(shows[0].title, "Frieren");
    assert.equal(shows[0].studio, "Madhouse");
    assert.equal(shows[0].description, "Hello there & friends");
  });

  it("stops at the hero limit", () => {
    const watching = Array.from({ length: MAX_HERO_SHOWS + 2 }, (_, index) =>
      entry({ id: `e-${index}`, title: `Show ${index}` }),
    );
    assert.equal(selectHeroShows(watching).length, MAX_HERO_SHOWS);
  });
});

describe("orderHeroShows", () => {
  it("keeps the original slots and appends shows that appeared later", () => {
    const ordered = orderHeroShows(
      ["a", "b", "gone"],
      [show({ entryId: "c", title: "New" }), show({ entryId: "b", title: "Second", progressEpisodes: 3 })],
    );
    assert.deepEqual(
      ordered.map((item) => [item.entryId, item.progressEpisodes]),
      [
        ["b", 3],
        ["c", 14],
      ],
    );
  });
});

describe("resolveActiveShow", () => {
  it("keeps the current pick, otherwise the most recently updated show", () => {
    const current = [show({ entryId: "new" }), show({ entryId: "old" })];
    assert.equal(resolveActiveShow("old", current)?.entryId, "old");
    assert.equal(resolveActiveShow("missing", current)?.entryId, "new");
    assert.equal(resolveActiveShow("missing", []), null);
  });
});

describe("credit lines", () => {
  it("formats a tracking line and drops missing parts", () => {
    assert.deepEqual(
      trackingCredit(show()).map((part) => part.text),
      ["Tracking", "Ep. 14 / 28", "Madhouse", "2023"],
    );
    assert.deepEqual(
      trackingCredit(show({ studio: null, seasonYear: null, totalEpisodes: null, progressEpisodes: 4 })).map(
        (part) => part.text,
      ),
      ["Tracking", "Ep. 4"],
    );
  });

  it("formats the completed line and the remainder", () => {
    assert.deepEqual(
      completedCredit(show({ progressEpisodes: 28 })).map((part) => part.text),
      ["Completed", "28 episodes"],
    );
    assert.equal(completedCredit(show({ totalEpisodes: 1, progressEpisodes: 1 }))[1].text, "1 episode");
    assert.equal(formatEpisodeCredit(9, 24), "Ep. 9 / 24");
    assert.equal(formatEpisodeCredit(4, null), "Ep. 4");
    assert.equal(remainingEpisodes(14, 28), 14);
    assert.equal(remainingEpisodes(28, 28), 0);
    assert.equal(remainingEpisodes(3, null), null);
  });

  it("formats a trending caption from the parts that exist", () => {
    assert.deepEqual(
      titleCredit({ title: "DAN DA DAN", studio: "Science SARU", seasonYear: 2024 }).map((part) => part.text),
      ["DAN DA DAN", "Science SARU", "2024"],
    );
    assert.deepEqual(titleCredit({ title: "Film", studio: null, seasonYear: null }).map((part) => part.text), [
      "Film",
    ]);
  });
});

describe("cleanDescription", () => {
  it("returns an empty string for missing copy", () => {
    assert.equal(cleanDescription(null), "");
    assert.equal(cleanDescription("   "), "");
  });
});
