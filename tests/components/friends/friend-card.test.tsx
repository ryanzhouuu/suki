import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { FriendCard } from "@/components/friends/friend-card";
import type { FriendWithProfile } from "@/lib/friends/queries";

function makeFriend(
  overrides: Partial<FriendWithProfile["profile"]> = {},
): FriendWithProfile {
  return {
    friendship: {} as FriendWithProfile["friendship"],
    profile: {
      user_id: "u1",
      username: "alexj",
      display_name: null,
      avatar_url: null,
      bio: null,
      ...overrides,
    },
  };
}

describe("FriendCard", () => {
  it("prefers display_name over username, and links to the profile", () => {
    render(<FriendCard friend={makeFriend({ display_name: "Alex Johnson" })} />);
    screen.getByText("Alex Johnson");
    screen.getByText("@alexj");
    const profileLinks = screen.getAllByRole("link", { name: /Alex Johnson|Profile/ });
    assert.ok(profileLinks.some((link) => link.getAttribute("href") === "/u/alexj"));
    cleanup();
  });

  it("falls back to username when display_name is missing", () => {
    render(<FriendCard friend={makeFriend()} />);
    screen.getByText("alexj");
    cleanup();
  });

  it("shows an avatar initial placeholder when there's no avatar_url", () => {
    render(<FriendCard friend={makeFriend({ display_name: "Alex" })} />);
    screen.getByText("A");
    assert.equal(screen.queryByRole("img"), null);
    cleanup();
  });

  it("shows bio when present and links to the taste comparison page", () => {
    render(<FriendCard friend={makeFriend({ bio: "I love anime" })} />);
    screen.getByText("I love anime");
    screen.getByRole("link", { name: "Compare taste" });
    cleanup();
  });
});
