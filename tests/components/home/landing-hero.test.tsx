import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { LandingHero } from "@/components/home/landing-hero";
import type { TrendingFeature } from "@/lib/anilist/discover";

const feature: TrendingFeature = {
  anilistId: 21,
  title: "DAN DA DAN",
  coverUrl: null,
  bannerUrl: "https://cdn/dandadan.jpg",
  studio: "Science SARU",
  format: "TV",
  seasonYear: 2024,
  rank: 1,
};

describe("LandingHero", () => {
  it("shows the tracking headline and the trending caption", () => {
    render(<LandingHero feature={feature} />);
    screen.getByRole("heading", { name: /Every show you watch/ });
    screen.getByText("in order.");
    assert.equal(
      screen.getByRole("link", { name: "Create free account" }).getAttribute("href"),
      "/auth/login?mode=signup",
    );
    assert.equal(screen.getByRole("link", { name: "Sign in" }).getAttribute("href"), "/auth/login");
    screen.getByText("DAN DA DAN");
    screen.getByText("#1 this week");
    cleanup();
  });

  it("keeps the same copy without artwork when trending is unavailable", () => {
    render(<LandingHero feature={null} />);
    screen.getByRole("heading", { name: /Every show you watch/ });
    screen.getByRole("link", { name: "Create free account" });
    assert.equal(screen.queryByText("DAN DA DAN"), null);
    assert.equal(document.querySelector("img"), null);
    cleanup();
  });
});
