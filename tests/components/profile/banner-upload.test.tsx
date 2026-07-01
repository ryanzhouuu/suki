import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BannerUpload as BannerUploadType } from "@/components/profile/banner-upload";
import type { ProfileActionState } from "@/actions/profile";
import type { Tables } from "@/types/database";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const uploadCalls: FormData[] = [];
const removeCalls: FormData[] = [];
let uploadResult: ProfileActionState = {};

mock.module("@/actions/banner", {
  namedExports: {
    uploadBanner: async (_prev: ProfileActionState, formData: FormData) => {
      uploadCalls.push(formData);
      return uploadResult;
    },
    removeBannerFromForm: async (_prev: ProfileActionState, formData: FormData) => {
      removeCalls.push(formData);
      return { message: "Banner removed." };
    },
  },
});

let BannerUpload: typeof BannerUploadType;

before(async () => {
  ({ BannerUpload } = await import("@/components/profile/banner-upload"));
});

function makeProfile(overrides: Partial<Tables<"profiles">> = {}): Tables<"profiles"> {
  return {
    user_id: "u1",
    username: "alexj",
    banner_url: null,
    ...overrides,
  } as unknown as Tables<"profiles">;
}

describe("BannerUpload", () => {
  afterEach(() => {
    cleanup();
    uploadCalls.length = 0;
    removeCalls.length = 0;
    uploadResult = {};
    router.refresh = () => {};
  });

  it("shows 'Upload banner' with no Remove option when there's no banner", () => {
    render(<BannerUpload profile={makeProfile()} />);
    screen.getByRole("button", { name: "Upload banner" });
    assert.equal(screen.queryByRole("button", { name: "Remove banner" }), null);
  });

  it("shows 'Replace banner' and a Remove option when a banner exists", () => {
    render(<BannerUpload profile={makeProfile({ banner_url: "banner.jpg" })} />);
    screen.getByRole("button", { name: "Replace banner" });
    screen.getByRole("button", { name: "Remove banner" });
  });

  it("submits the chosen file automatically and refreshes on success", async () => {
    uploadResult = { message: "Banner updated." };
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<BannerUpload profile={makeProfile()} />);
    const file = new File(["data"], "banner.png", { type: "image/png" });
    const input = document.getElementById("banner") as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    fireEvent.change(input);

    await waitFor(() => assert.equal(uploadCalls.length, 1));
    const submitted = uploadCalls[0].get("banner") as File;
    assert.equal(submitted.name, "banner.png");
    await waitFor(() => assert.equal(refreshed, true));
    screen.getByText("Banner updated.");
  });

  it("removes the banner and refreshes on Remove banner", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<BannerUpload profile={makeProfile({ banner_url: "banner.jpg" })} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove banner" }));
    await waitFor(() => assert.equal(removeCalls.length, 1));
    await waitFor(() => assert.equal(refreshed, true));
    screen.getByText("Banner removed.");
  });
});
