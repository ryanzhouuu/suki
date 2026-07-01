import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { HomeHero } from "@/components/home/home-hero";
import type { HeroHeadline } from "@/lib/home/hero-copy";

function makeHeadline(overrides: Partial<HeroHeadline> = {}): HeroHeadline {
  return {
    lead: "Welcome back to your",
    emphasis: "watchlist",
    description: "Pick up right where you left off.",
    ...overrides,
  };
}

describe("HomeHero", () => {
  it("greets the user and shows the headline", () => {
    // bgSrc left empty — see hero-background.test.tsx for why.
    render(
      <HomeHero
        greetingName="Alex"
        watchingCount={0}
        headline={makeHeadline()}
        bgSrc=""
      />,
    );
    screen.getByText("Welcome back, Alex");
    screen.getByText("watchlist");
    screen.getByText("Pick up right where you left off.");
  });

  it("shows a watching-count pill only when watchingCount > 0, pluralized", () => {
    render(
      <HomeHero greetingName="Alex" watchingCount={0} headline={makeHeadline()} bgSrc="" />,
    );
    assert.equal(screen.queryByText(/in progress/), null);
    cleanup();

    render(
      <HomeHero greetingName="Alex" watchingCount={1} headline={makeHeadline()} bgSrc="" />,
    );
    screen.getByText("1 show in progress");
    cleanup();

    render(
      <HomeHero greetingName="Alex" watchingCount={3} headline={makeHeadline()} bgSrc="" />,
    );
    screen.getByText("3 shows in progress");
    cleanup();
  });

  it("links to search and ranking", () => {
    render(
      <HomeHero greetingName="Alex" watchingCount={0} headline={makeHeadline()} bgSrc="" />,
    );
    assert.equal(
      screen.getByRole("link", { name: "Search anime" }).getAttribute("href"),
      "/search",
    );
    assert.equal(
      screen.getByRole("link", { name: "Open ranking" }).getAttribute("href"),
      "/ranking",
    );
    cleanup();
  });

  it("shows a trailing character when provided instead of the default period", () => {
    render(
      <HomeHero
        greetingName="Alex"
        watchingCount={0}
        headline={makeHeadline({ trailing: "!" })}
        bgSrc=""
      />,
    );
    screen.getByText("!");
  });
});
