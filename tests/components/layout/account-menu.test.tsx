import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AccountMenu as AccountMenuType } from "@/components/layout/account-menu";

import { installNavigationMock } from "../../helpers/mock-navigation";

installNavigationMock({ pathname: "/home" });

mock.module("@/actions/auth", {
  namedExports: {
    signOut: async () => {},
  },
});

let AccountMenu: typeof AccountMenuType;

before(async () => {
  ({ AccountMenu } = await import("@/components/layout/account-menu"));
});

describe("AccountMenu", () => {
  afterEach(cleanup);

  it("toggles from the avatar and closes after choosing Profile", () => {
    render(
      <AccountMenu
        username="alexj"
        avatarUrl={null}
        initial="A"
        isSeriesAdmin={false}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open account menu" });
    assert.equal(trigger.getAttribute("aria-expanded"), "false");

    fireEvent.click(trigger);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    fireEvent.click(screen.getByRole("link", { name: "Profile" }));

    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.equal(screen.queryByRole("navigation", { name: "Account" }), null);
  });

  it("closes on Escape and returns focus to the avatar", () => {
    render(
      <AccountMenu username="alexj" avatarUrl={null} initial="A" />,
    );

    const trigger = screen.getByRole("button", { name: "Open account menu" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    assert.equal(screen.queryByRole("navigation", { name: "Account" }), null);
    assert.equal(document.activeElement, trigger);
  });

  it("closes when the user presses outside the menu", () => {
    render(
      <div>
        <AccountMenu username="alexj" avatarUrl={null} initial="A" />
        <button type="button">Outside</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));

    assert.equal(screen.queryByRole("navigation", { name: "Account" }), null);
  });
});
