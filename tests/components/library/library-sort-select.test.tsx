import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { LibrarySortSelect as LibrarySortSelectType } from "@/components/library/library-sort-select";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { router, setPathname, setSearchParams } = installNavigationMock({
  pathname: "/library",
});
let LibrarySortSelect: typeof LibrarySortSelectType;

before(async () => {
  ({ LibrarySortSelect } = await import(
    "@/components/library/library-sort-select"
  ));
});

describe("LibrarySortSelect", () => {
  afterEach(() => {
    cleanup();
    setPathname("/library");
    setSearchParams("");
    router.replace = () => {};
  });

  it("defaults to 'Recently updated' with no status or sort param", () => {
    render(<LibrarySortSelect />);
    screen.getByText("Recently updated");
  });

  it("defaults to 'Priority' for the plan_to_watch status", () => {
    render(<LibrarySortSelect status="plan_to_watch" />);
    screen.getByText("Priority");
  });

  it("opens the listbox and lists status-appropriate sort options", () => {
    render(<LibrarySortSelect status="completed" />);
    fireEvent.click(screen.getByRole("button", { name: /Personal score/ }));
    screen.getByRole("listbox", { name: "Sort library" });
    screen.getByRole("option", { name: "Completed date" });
    assert.equal(screen.queryByRole("option", { name: "Priority" }), null);
  });

  it("sets the sort param and resets direction when choosing a non-default sort", () => {
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<LibrarySortSelect />);
    fireEvent.click(screen.getByRole("button", { name: /Recently updated/ }));
    fireEvent.click(screen.getByRole("option", { name: "Title" }));
    assert.equal(replaced, "/library?sort=title");
  });

  it("removes the sort param when choosing the status's default sort", () => {
    setSearchParams("sort=title&dir=asc");
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<LibrarySortSelect />);
    fireEvent.click(screen.getByRole("button", { name: /Title/ }));
    fireEvent.click(screen.getByRole("option", { name: "Recently updated" }));
    assert.equal(replaced, "/library");
  });

  it("toggles direction and reflects it in the aria-label", () => {
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<LibrarySortSelect />);
    screen.getByRole("button", { name: "Sorting descending" });
    fireEvent.click(screen.getByRole("button", { name: "Sorting descending" }));
    assert.equal(replaced, "/library?dir=asc");
  });
});
