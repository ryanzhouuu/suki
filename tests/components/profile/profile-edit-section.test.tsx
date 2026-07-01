import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type { ProfileEditSection as ProfileEditSectionType } from "@/components/profile/profile-edit-section";
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

let ProfileEditSection: typeof ProfileEditSectionType;

before(async () => {
  ({ ProfileEditSection } = await import(
    "@/components/profile/profile-edit-section"
  ));
});

function makeProfile(): Tables<"profiles"> {
  return {
    user_id: "u1",
    username: "alexj",
    display_name: "Alex Johnson",
    bio: null,
    show_activity_to_friends: true,
    avatar_url: null,
    banner_url: null,
  } as unknown as Tables<"profiles">;
}

describe("ProfileEditSection", () => {
  afterEach(() => cleanup());

  it("shows an 'Edit profile' link to the edit URL when not editing", () => {
    render(<ProfileEditSection profile={makeProfile()} editing={false} />);
    const link = screen.getByRole("link", { name: "Edit profile" });
    assert.equal(link.getAttribute("href"), "/u/alexj?edit=1");
  });

  it("shows the edit form and a 'Done' link back to the profile when editing", () => {
    render(<ProfileEditSection profile={makeProfile()} editing />);
    screen.getByRole("heading", { name: "Edit profile" });
    screen.getByLabelText("Display name");
    const done = screen.getByRole("link", { name: "Done" });
    assert.equal(done.getAttribute("href"), "/u/alexj");
  });
});
