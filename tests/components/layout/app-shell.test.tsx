import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AppShell as AppShellType } from "@/components/layout/app-shell";
import type { Tables } from "@/types/database";

import { installNavigationMock } from "../../helpers/mock-navigation";

installNavigationMock({ pathname: "/home" });

mock.module("@/actions/auth", {
  namedExports: {
    signOut: async () => {},
  },
});

let unreadCount = 0;
mock.module("@/lib/friend-recommendations/queries", {
  namedExports: {
    getUnreadRecommendationCount: async () => unreadCount,
  },
});

let AppShell: typeof AppShellType;

before(async () => {
  ({ AppShell } = await import("@/components/layout/app-shell"));
});

function makeProfile(overrides: Partial<Tables<"profiles">> = {}): Tables<"profiles"> {
  return {
    user_id: "u1",
    username: "alexj",
    display_name: null,
    avatar_url: null,
    ...overrides,
  } as unknown as Tables<"profiles">;
}

describe("AppShell", () => {
  afterEach(() => {
    cleanup();
    unreadCount = 0;
  });

  it("renders account actions in the avatar menu", async () => {
    const element = await AppShell({
      children: <p>Page content</p>,
      profile: makeProfile(),
    });
    render(element);
    screen.getByText("Page content");
    assert.equal(screen.queryByRole("link", { name: "Profile" }), null);

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));

    assert.equal(screen.getByRole("link", { name: "Profile" }).getAttribute("href"), "/u/alexj");
    screen.getByRole("button", { name: "Sign out" });
  });

  it("shows the display_name (or username) initial as an avatar fallback", async () => {
    const element = await AppShell({
      children: <p>Page content</p>,
      profile: makeProfile({ display_name: "Bob" }),
    });
    render(element);
    screen.getByText("B");
  });

  it("only shows the Admin menu item for series admins", async () => {
    const nonAdmin = await AppShell({
      children: <p>Content</p>,
      profile: makeProfile(),
      isSeriesAdmin: false,
    });
    render(nonAdmin);
    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    assert.equal(screen.queryByRole("link", { name: "Admin" }), null);
    cleanup();

    const admin = await AppShell({
      children: <p>Content</p>,
      profile: makeProfile(),
      isSeriesAdmin: true,
    });
    render(admin);
    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    assert.equal(
      screen.getByRole("link", { name: "Admin" }).getAttribute("href"),
      "/admin/series",
    );
  });

  it("shows a friend-nav badge with the unread recommendation count", async () => {
    unreadCount = 4;
    const element = await AppShell({
      children: <p>Content</p>,
      profile: makeProfile(),
    });
    render(element);
    screen.getByLabelText("4 new");
  });
});
