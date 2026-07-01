import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { LibraryTabs as LibraryTabsType } from "@/components/library/library-tabs";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { setPathname, setSearchParams } = installNavigationMock({
  pathname: "/library",
});
let LibraryTabs: typeof LibraryTabsType;

before(async () => {
  ({ LibraryTabs } = await import("@/components/library/library-tabs"));
});

describe("LibraryTabs", () => {
  it("marks 'All' as current and links other tabs with a status param", () => {
    setPathname("/library");
    setSearchParams("");
    render(<LibraryTabs />);
    const all = screen.getByRole("link", { name: "All" });
    assert.equal(all.getAttribute("aria-current"), "page");
    const watching = screen.getByRole("link", { name: "Watching" });
    assert.equal(watching.getAttribute("href"), "/library?status=watching");
    assert.equal(watching.getAttribute("aria-current"), null);
    cleanup();
  });

  it("marks the active tab from the status param and drops it from the 'All' link", () => {
    setSearchParams("status=completed");
    render(<LibraryTabs />);
    const completed = screen.getByRole("link", { name: "Completed" });
    assert.equal(completed.getAttribute("aria-current"), "page");
    const all = screen.getByRole("link", { name: "All" });
    assert.equal(all.getAttribute("href"), "/library");
    cleanup();
  });

  it("preserves other query params when switching tabs", () => {
    setSearchParams("status=watching&sort=score");
    render(<LibraryTabs />);
    const dropped = screen.getByRole("link", { name: "Dropped" });
    assert.equal(dropped.getAttribute("href"), "/library?status=dropped&sort=score");
    cleanup();
  });
});
