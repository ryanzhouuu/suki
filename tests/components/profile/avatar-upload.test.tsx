import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AvatarUpload as AvatarUploadType } from "@/components/profile/avatar-upload";
import type { ProfileActionState } from "@/actions/profile";
import type { Tables } from "@/types/database";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const uploadCalls: FormData[] = [];
const removeCalls: FormData[] = [];
let uploadResult: ProfileActionState = {};

mock.module("@/actions/avatar", {
  namedExports: {
    uploadAvatar: async (_prev: ProfileActionState, formData: FormData) => {
      uploadCalls.push(formData);
      return uploadResult;
    },
    removeAvatarFromForm: async (_prev: ProfileActionState, formData: FormData) => {
      removeCalls.push(formData);
      return { message: "Avatar removed." };
    },
  },
});

let AvatarUpload: typeof AvatarUploadType;

before(async () => {
  ({ AvatarUpload } = await import("@/components/profile/avatar-upload"));
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

describe("AvatarUpload", () => {
  afterEach(() => {
    cleanup();
    uploadCalls.length = 0;
    removeCalls.length = 0;
    uploadResult = {};
    router.refresh = () => {};
  });

  it("shows an initial-letter placeholder and 'Upload photo' when there's no avatar", () => {
    render(<AvatarUpload profile={makeProfile({ display_name: "Bob" })} />);
    screen.getByText("B");
    screen.getByRole("button", { name: "Upload photo" });
    assert.equal(screen.queryByRole("button", { name: "Remove photo" }), null);
  });

  it("shows 'Replace photo' and a Remove option when an avatar exists", () => {
    render(<AvatarUpload profile={makeProfile({ avatar_url: "avatar.jpg" })} />);
    screen.getByRole("button", { name: "Replace photo" });
    screen.getByRole("button", { name: "Remove photo" });
  });

  it("submits the chosen file automatically and refreshes on success", async () => {
    uploadResult = { message: "Avatar updated." };
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<AvatarUpload profile={makeProfile()} />);
    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const input = document.getElementById("avatar") as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    fireEvent.change(input);

    await waitFor(() => assert.equal(uploadCalls.length, 1));
    const submitted = uploadCalls[0].get("avatar") as File;
    assert.equal(submitted.name, "avatar.png");
    assert.equal(submitted.type, "image/png");
    await waitFor(() => assert.equal(refreshed, true));
    screen.getByText("Avatar updated.");
  });

  it("shows an error instead of refreshing when the upload fails", async () => {
    uploadResult = { error: "File too large" };
    render(<AvatarUpload profile={makeProfile()} />);
    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const input = document.getElementById("avatar") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByRole("alert");
    screen.getByText("File too large");
  });

  it("removes the avatar and refreshes on Remove photo", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<AvatarUpload profile={makeProfile({ avatar_url: "avatar.jpg" })} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    await waitFor(() => assert.equal(removeCalls.length, 1));
    await waitFor(() => assert.equal(refreshed, true));
    screen.getByText("Avatar removed.");
  });
});
