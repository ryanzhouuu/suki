import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { GroupToggle as GroupToggleType } from "@/components/library/group-toggle";

import { installNavigationMock } from "../../helpers/mock-navigation";

const { router, setPathname, setSearchParams } = installNavigationMock({
  pathname: "/library",
});
let GroupToggle: typeof GroupToggleType;

before(async () => {
  ({ GroupToggle } = await import("@/components/library/group-toggle"));
});

describe("GroupToggle", () => {
  afterEach(() => {
    cleanup();
    setPathname("/library");
    setSearchParams("");
    router.replace = () => {};
  });

  it("is off and unchecked when the group param is absent", () => {
    render(<GroupToggle />);
    const toggle = screen.getByRole("switch");
    assert.equal(toggle.getAttribute("aria-checked"), "false");
  });

  it("is on when group=series is set", () => {
    setSearchParams("group=series");
    render(<GroupToggle />);
    const toggle = screen.getByRole("switch");
    assert.equal(toggle.getAttribute("aria-checked"), "true");
  });

  it("adds the group param when toggled on", () => {
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<GroupToggle />);
    fireEvent.click(screen.getByRole("switch"));
    assert.equal(replaced, "/library?group=series");
  });

  it("removes the group param when toggled off", () => {
    setSearchParams("group=series&status=watching");
    let replaced: string | null = null;
    router.replace = (href) => (replaced = href);
    render(<GroupToggle />);
    fireEvent.click(screen.getByRole("switch"));
    assert.equal(replaced, "/library?status=watching");
  });
});
