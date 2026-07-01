import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ImportStart as ImportStartType } from "@/components/imports/import-start";
import type { StartImportState } from "@/actions/imports";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const startCalls: FormData[] = [];
let startResult: StartImportState = {};

mock.module("@/actions/imports", {
  namedExports: {
    startImport: async (_prev: StartImportState, formData: FormData) => {
      startCalls.push(formData);
      return startResult;
    },
  },
});

let ImportStart: typeof ImportStartType;

before(async () => {
  ({ ImportStart } = await import("@/components/imports/import-start"));
});

describe("ImportStart", () => {
  afterEach(() => {
    cleanup();
    startCalls.length = 0;
    startResult = {};
    router.refresh = () => {};
  });

  it("defaults to the AniList tab with a username field", () => {
    render(<ImportStart />);
    screen.getByLabelText("AniList username");
  });

  it("switches to the MyAnimeList file field when that source is selected", () => {
    render(<ImportStart />);
    fireEvent.click(screen.getByRole("button", { name: /^MyAnimeList/ }));
    screen.getByLabelText("MyAnimeList export (.xml)");
    assert.equal(screen.queryByLabelText("AniList username"), null);
  });

  it("switches to the plain-text textarea when that source is selected", () => {
    render(<ImportStart />);
    fireEvent.click(screen.getByRole("button", { name: /^Plain text/ }));
    screen.getByLabelText("Titles");
  });

  it("submits the form with the selected source and field values", async () => {
    render(<ImportStart />);
    fireEvent.change(screen.getByLabelText("AniList username"), {
      target: { value: "myusername" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Start import" }).closest("form")!);

    await waitFor(() => assert.equal(startCalls.length, 1));
    const formData = startCalls[0];
    assert.equal(formData.get("source"), "anilist");
    assert.equal(formData.get("username"), "myusername");
  });

  it("shows the error returned by the action", async () => {
    startResult = { error: "That username isn't public" };
    render(<ImportStart />);
    fireEvent.change(screen.getByLabelText("AniList username"), {
      target: { value: "private_user" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Start import" }).closest("form")!);
    await screen.findByRole("alert");
    screen.getByText("That username isn't public");
  });

  it("refreshes the router once a jobId comes back", async () => {
    startResult = { jobId: "job-1" };
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<ImportStart />);
    fireEvent.change(screen.getByLabelText("AniList username"), {
      target: { value: "myusername" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Start import" }).closest("form")!);
    await waitFor(() => assert.equal(refreshed, true));
  });
});
