import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type {
  DesktopNav as DesktopNavType,
  MobileNav as MobileNavType,
} from "@/components/layout/main-nav";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { setPathname } = installNavigationMock({ pathname: "/library" });
let DesktopNav: typeof DesktopNavType;
let MobileNav: typeof MobileNavType;

before(async () => {
  ({ DesktopNav, MobileNav } = await import("@/components/layout/main-nav"));
});

describe("DesktopNav", () => {
  afterEach(() => cleanup());

  it("marks the current top-level route as active", () => {
    setPathname("/library");
    render(<DesktopNav />);
    const library = screen.getByRole("link", { name: "Library" });
    assert.equal(library.getAttribute("aria-current"), "page");
    const search = screen.getByRole("link", { name: "Search" });
    assert.equal(search.getAttribute("aria-current"), null);
  });

  it("marks a nested route as active for its top-level nav item", () => {
    setPathname("/library/entry-1");
    render(<DesktopNav />);
    const library = screen.getByRole("link", { name: "Library" });
    assert.equal(library.getAttribute("aria-current"), "page");
  });

  it("shows a badge count on the matching nav item", () => {
    setPathname("/library");
    render(<DesktopNav badges={{ "/friends": 3 }} />);
    screen.getByLabelText("3 new");
  });

  it("caps the visible badge text at '9+' while keeping the full count in aria-label", () => {
    setPathname("/library");
    render(<DesktopNav badges={{ "/friends": 15 }} />);
    const badge = screen.getByLabelText("15 new");
    assert.equal(badge.textContent, "9+");
  });
});

describe("MobileNav", () => {
  afterEach(() => cleanup());

  it("shows the mobile label as visible text and marks the active route", () => {
    setPathname("/ranking");
    render(<MobileNav />);
    const rank = screen.getByRole("link", { name: "Ranking" });
    assert.equal(rank.getAttribute("aria-current"), "page");
    assert.equal(screen.getByText("Rank").textContent, "Rank");
  });

  it("includes the badge count in the accessible label", () => {
    setPathname("/library");
    render(<MobileNav badges={{ "/friends": 2 }} />);
    screen.getByRole("link", { name: "Friends (2 new)" });
  });
});
