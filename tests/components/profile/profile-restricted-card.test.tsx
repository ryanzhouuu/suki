import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { ProfileRestrictedCard } from "@/components/profile/profile-restricted-card";

describe("ProfileRestrictedCard", () => {
  it("shows the display name, username, and a private-profile message", () => {
    render(
      <ProfileRestrictedCard
        profile={{ username: "alexj", display_name: "Alex Johnson", avatar_url: null }}
      />,
    );
    screen.getByText("Alex Johnson");
    screen.getByText("@alexj");
    screen.getByText("This profile is private.");
    cleanup();
  });

  it("falls back to username and an initial avatar when there's no display_name/avatar_url", () => {
    render(
      <ProfileRestrictedCard
        profile={{ username: "alexj", display_name: null, avatar_url: null }}
      />,
    );
    screen.getByRole("heading", { name: "alexj" });
    screen.getByText("@alexj");
    screen.getByText("A");
    cleanup();
  });

  it("hides the sign-in link by default", () => {
    render(
      <ProfileRestrictedCard
        profile={{ username: "alexj", display_name: null, avatar_url: null }}
      />,
    );
    assert.equal(screen.queryByRole("link", { name: "Sign in" }), null);
    cleanup();
  });

  it("shows the sign-in link when showSignIn is true", () => {
    render(
      <ProfileRestrictedCard
        profile={{ username: "alexj", display_name: null, avatar_url: null }}
        showSignIn
      />,
    );
    const link = screen.getByRole("link", { name: "Sign in" });
    assert.equal(link.getAttribute("href"), "/auth/login");
    cleanup();
  });
});
