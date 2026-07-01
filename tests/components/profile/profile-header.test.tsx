import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { ProfileHeader as ProfileHeaderType } from "@/components/profile/profile-header";
import type { Tables } from "@/types/database";

import { installRouterMock } from "../../helpers/mock-router";

installRouterMock();

mock.module("@/actions/profile", {
  namedExports: { updateProfile: async () => ({}) },
});
mock.module("@/actions/avatar", {
  namedExports: { uploadAvatar: async () => ({}), removeAvatarFromForm: async () => ({}) },
});
mock.module("@/actions/banner", {
  namedExports: { uploadBanner: async () => ({}), removeBannerFromForm: async () => ({}) },
});
mock.module("@/actions/friends", {
  namedExports: {
    sendFriendRequest: async () => ({}),
    removeFriend: async () => ({}),
    cancelFriendRequest: async () => ({}),
    respondToFriendRequest: async () => ({}),
  },
});

let ProfileHeader: typeof ProfileHeaderType;

before(async () => {
  ({ ProfileHeader } = await import("@/components/profile/profile-header"));
});

function makeProfile(overrides: Partial<Tables<"profiles">> = {}): Tables<"profiles"> {
  return {
    user_id: "u1",
    username: "alexj",
    display_name: "Alex Johnson",
    bio: null,
    avatar_url: null,
    banner_url: null,
    profile_visibility: "public",
    ...overrides,
  } as unknown as Tables<"profiles">;
}

const baseProps = {
  isOwnProfile: false,
  isEditing: false,
  viewerId: null,
  friendshipId: null,
  friendshipStatus: "none" as const,
  tasteSimilarity: null,
  snapshot: { tracked: 10, completed: 5, ranked: 3 },
};

describe("ProfileHeader", () => {
  afterEach(() => cleanup());

  it("shows the display name, username, and snapshot counts", () => {
    render(<ProfileHeader profile={makeProfile()} {...baseProps} />);
    screen.getByRole("heading", { name: "Alex Johnson" });
    screen.getByText("@alexj");
    screen.getByText("10 tracked");
    screen.getByText("5 completed");
    screen.getByText("3 ranked");
  });

  it("shows a taste similarity badge when provided", () => {
    render(
      <ProfileHeader
        profile={makeProfile()}
        {...baseProps}
        tasteSimilarity={{ status: "ready", score: 77, label: "Great match", confidence: "high" }}
      />,
    );
    screen.getByText("77%");
  });

  it("shows the visibility badge only for your own profile", () => {
    render(<ProfileHeader profile={makeProfile()} {...baseProps} isOwnProfile />);
    screen.getByText("Public");
  });

  it("hides the visibility badge on someone else's profile", () => {
    render(<ProfileHeader profile={makeProfile()} {...baseProps} />);
    assert.equal(screen.queryByText("Public"), null);
  });

  it("shows 'Edit profile' and a share button on your own profile", () => {
    render(<ProfileHeader profile={makeProfile()} {...baseProps} isOwnProfile />);
    screen.getByRole("link", { name: "Edit profile" });
    screen.getByRole("button", { name: /Share/ });
  });

  it("shows a friend action button for other viewers who are signed in", () => {
    render(
      <ProfileHeader profile={makeProfile()} {...baseProps} viewerId="viewer-1" />,
    );
    screen.getByRole("button", { name: "Add friend" });
  });

  it("shows a sign-in prompt for anonymous viewers", () => {
    render(<ProfileHeader profile={makeProfile()} {...baseProps} viewerId={null} />);
    screen.getByRole("link", { name: "Sign in to connect" });
  });

  it("shows a recommend button once friends", () => {
    render(
      <ProfileHeader
        profile={makeProfile()}
        {...baseProps}
        viewerId="viewer-1"
        friendshipId="f1"
        friendshipStatus="friends"
      />,
    );
    screen.getByRole("button", { name: /Recommend an anime/ });
  });
});
