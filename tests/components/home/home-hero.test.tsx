import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { HomeHero as HomeHeroType } from "@/components/home/home-hero";
import type { TrendingFeature } from "@/lib/anilist/discover";
import type { HeroShow } from "@/lib/home/featured";

import { installRouterMock } from "../../helpers/mock-router";

installRouterMock();

const updates: Array<{ id: string; patch?: unknown; status?: string }> = [];

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async (id: string, patch: unknown) => {
      updates.push({ id, patch });
      return {};
    },
    addAnimeEntry: async (id: number, status: string) => {
      updates.push({ id: String(id), status });
      return {};
    },
  },
});

let HomeHero: typeof HomeHeroType;

before(async () => {
  ({ HomeHero } = await import("@/components/home/home-hero"));
});

function show(overrides: Partial<HeroShow> = {}): HeroShow {
  return {
    entryId: "entry-1",
    anilistId: 154587,
    title: "Frieren",
    bannerUrl: "https://cdn/frieren.jpg",
    description: "An elf mage learning to live.",
    progressEpisodes: 14,
    totalEpisodes: 28,
    studio: "Madhouse",
    seasonYear: 2023,
    ...overrides,
  };
}

function feature(overrides: Partial<TrendingFeature> = {}): TrendingFeature {
  return {
    anilistId: 21,
    title: "DAN DA DAN",
    coverUrl: null,
    bannerUrl: "https://cdn/dandadan.jpg",
    studio: "Science SARU",
    format: "TV",
    seasonYear: 2024,
    rank: 1,
    ...overrides,
  };
}

describe("HomeHero", () => {
  afterEach(() => {
    cleanup();
    updates.length = 0;
  });

  it("features the show with a tracking credit, progress, and log button", () => {
    render(<HomeHero shows={[show()]} trending={null} />);
    screen.getByRole("heading", { name: "Frieren" });
    screen.getByText("An elf mage learning to live.");
    screen.getByText("Madhouse");
    screen.getByText("14 left");
    assert.equal(
      screen.getByRole("link", { name: "Details" }).getAttribute("href"),
      "/anime/154587",
    );
    screen.getByRole("button", { name: "✓ Mark ep. 15 watched" });
    assert.equal(screen.queryByText(/Also tracking/i), null);
  });

  it("drops missing credit parts", () => {
    render(
      <HomeHero
        shows={[show({ studio: null, seasonYear: null, totalEpisodes: null, progressEpisodes: 4 })]}
        trending={null}
      />,
    );
    assert.equal(screen.queryByText("Madhouse"), null);
    assert.equal(screen.queryByText("2023"), null);
    assert.equal(screen.queryByText(/left/i), null);
    screen.getByRole("button", { name: "✓ Mark ep. 5 watched" });
  });

  it("switches the featured show without reordering the strip", () => {
    const first = show();
    const second = show({
      entryId: "entry-2",
      anilistId: 2,
      title: "Dungeon Meshi",
      studio: "Trigger",
      seasonYear: 2024,
      progressEpisodes: 9,
      totalEpisodes: 24,
    });
    const { rerender } = render(<HomeHero shows={[first, second]} trending={null} />);
    screen.getByRole("heading", { name: "Frieren" });

    rerender(<HomeHero shows={[second, first]} trending={null} />);
    screen.getByRole("heading", { name: "Frieren" });

    const thumbs = screen.getAllByRole("button", { name: /Show / });
    assert.deepEqual(
      thumbs.map((thumb) => thumb.getAttribute("aria-label")),
      ["Show Frieren", "Show Dungeon Meshi"],
    );

    fireEvent.click(screen.getByRole("button", { name: "Show Dungeon Meshi" }));
    screen.getByRole("heading", { name: "Dungeon Meshi" });
    screen.getByRole("button", { name: "✓ Mark ep. 10 watched" });
  });

  it("logs the next episode and shows a completed state on the final one", () => {
    render(
      <HomeHero
        shows={[show({ progressEpisodes: 27, totalEpisodes: 28 })]}
        trending={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "✓ Mark ep. 28 watched" }));
    assert.equal(
      (updates[0]?.patch as { progressEpisodes: number }).progressEpisodes,
      28,
    );
    screen.getByText("Completed");
    assert.equal(screen.getByRole("link", { name: "Rank it" }).getAttribute("href"), "/ranking");
    assert.equal(screen.queryByRole("button", { name: /Mark ep/ }), null);
  });

  it("keeps a show finished from the hero after it leaves the watching list", () => {
    const current = show({ progressEpisodes: 27, totalEpisodes: 28 });
    const other = show({
      entryId: "entry-2",
      anilistId: 2,
      title: "Dungeon Meshi",
      progressEpisodes: 3,
      totalEpisodes: 24,
    });
    const { rerender } = render(<HomeHero shows={[current, other]} trending={null} />);
    fireEvent.click(screen.getByRole("button", { name: "✓ Mark ep. 28 watched" }));
    rerender(<HomeHero shows={[other]} trending={null} />);
    screen.getByRole("heading", { name: "Frieren" });
    assert.equal(screen.getByRole("link", { name: "Rank it" }).getAttribute("href"), "/ranking");
    assert.equal(screen.queryByRole("heading", { name: "Dungeon Meshi" }), null);
  });

  it("falls back to the trending show when nothing is in progress", () => {
    render(<HomeHero shows={[]} trending={feature()} />);
    screen.getByRole("heading", { name: "DAN DA DAN" });
    screen.getByText("Now trending");
    screen.getByRole("button", { name: "Add to list" });
    assert.equal(screen.getByRole("link", { name: "Search anime" }).getAttribute("href"), "/search");
    assert.equal(screen.queryByText(/Also tracking/i), null);
  });

  it("stays a text hero when trending art is unavailable", () => {
    render(<HomeHero shows={[]} trending={null} />);
    screen.getByRole("heading", { name: "Nothing in progress yet" });
    screen.getByRole("link", { name: "Search anime" });
    assert.equal(screen.queryByRole("button", { name: "Add to list" }), null);
    assert.equal(document.querySelector("img"), null);
  });
});
