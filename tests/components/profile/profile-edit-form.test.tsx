import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ProfileEditForm as ProfileEditFormType } from "@/components/profile/profile-edit-form";
import type { ProfileActionState } from "@/actions/profile";
import type { Tables } from "@/types/database";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const updateCalls: FormData[] = [];
let updateResult: ProfileActionState = {};

mock.module("@/actions/avatar", {
  namedExports: {
    uploadAvatar: async () => ({}),
    removeAvatarFromForm: async () => ({}),
  },
});
mock.module("@/actions/banner", {
  namedExports: {
    uploadBanner: async () => ({}),
    removeBannerFromForm: async () => ({}),
  },
});

let ProfileEditForm: typeof ProfileEditFormType;

before(async () => {
  ({ ProfileEditForm } = await import("@/components/profile/profile-edit-form"));
});

const updateProfile = async (_prev: ProfileActionState, formData: FormData) => {
  updateCalls.push(formData);
  return updateResult;
};

function makeProfile(overrides: Partial<Tables<"profiles">> = {}): Tables<"profiles"> {
  return {
    user_id: "u1",
    username: "alexj",
    display_name: "Alex Johnson",
    bio: "Anime fan",
    show_activity_to_friends: true,
    avatar_url: null,
    banner_url: null,
    ...overrides,
  } as unknown as Tables<"profiles">;
}

describe("ProfileEditForm", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    updateResult = {};
    router.refresh = () => {};
  });

  it("pre-fills display name, bio, and the username footer", () => {
    render(<ProfileEditForm profile={makeProfile()} action={updateProfile} />);
    assert.equal(
      (screen.getByLabelText("Display name") as HTMLInputElement).value,
      "Alex Johnson",
    );
    assert.equal((screen.getByLabelText("Bio") as HTMLInputElement).value, "Anime fan");
    screen.getByText("@alexj");
  });

  it("submits the edited fields and refreshes the router on success", async () => {
    updateResult = { message: "Saved." };
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<ProfileEditForm profile={makeProfile()} action={updateProfile} />);
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "New Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => assert.equal(updateCalls.length, 1));
    assert.equal(updateCalls[0].get("display_name"), "New Name");
    await waitFor(() => assert.equal(refreshed, true));
    screen.getByText("Saved.");
  });

  it("shows an error without refreshing when the save fails", async () => {
    updateResult = { error: "Could not save" };
    render(<ProfileEditForm profile={makeProfile()} action={updateProfile} />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("alert");
    screen.getByText("Could not save");
  });

  it("links to /import for bringing in a list", () => {
    render(<ProfileEditForm profile={makeProfile()} action={updateProfile} />);
    const link = screen.getByRole("link", { name: "Import" });
    assert.equal(link.getAttribute("href"), "/import");
  });
});
