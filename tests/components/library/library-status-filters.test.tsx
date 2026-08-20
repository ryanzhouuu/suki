import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { LibraryStatusFilters as LibraryStatusFiltersType } from "@/components/library/library-status-filters";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { setPathname, setSearchParams } = installNavigationMock({
  pathname: "/library",
});
let LibraryStatusFilters: typeof LibraryStatusFiltersType;

before(async () => {
  ({ LibraryStatusFilters } = await import(
    "@/components/library/library-status-filters"
  ));
});

describe("LibraryStatusFilters", () => {
  it("marks All as current and links statuses with the status param", () => {
    setPathname("/library");
    setSearchParams("");
    render(<LibraryStatusFilters />);

    assert.equal(
      screen.getByRole("link", { name: "All" }).getAttribute("aria-current"),
      "page",
    );
    assert.equal(
      screen.getByRole("link", { name: "Watching" }).getAttribute("href"),
      "/library?status=watching",
    );
    cleanup();
  });

  it("preserves other query params when switching status", () => {
    setSearchParams("status=watching&sort=score&group=series");
    render(<LibraryStatusFilters />);

    assert.equal(
      screen.getByRole("link", { name: "Completed" }).getAttribute("href"),
      "/library?status=completed&sort=score&group=series",
    );
    assert.equal(
      screen.getByRole("link", { name: "All" }).getAttribute("href"),
      "/library?sort=score&group=series",
    );
    cleanup();
  });

  it("marks the selected status as current", () => {
    setSearchParams("status=plan_to_watch");
    render(<LibraryStatusFilters />);

    assert.equal(
      screen
        .getByRole("link", { name: "Plan to watch" })
        .getAttribute("aria-current"),
      "page",
    );
    cleanup();
  });
});
