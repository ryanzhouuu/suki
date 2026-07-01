import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { StatusPicker as StatusPickerType } from "@/components/anime/status-picker";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();
const addAnimeEntryCalls: Array<{ anilistId: number; status: string }> = [];
let addAnimeEntryResult: { error?: string } = {};

mock.module("@/actions/library", {
  namedExports: {
    addAnimeEntry: async (anilistId: number, status: string) => {
      addAnimeEntryCalls.push({ anilistId, status });
      return addAnimeEntryResult;
    },
  },
});

let StatusPicker: typeof StatusPickerType;

before(async () => {
  ({ StatusPicker } = await import("@/components/anime/status-picker"));
});

describe("StatusPicker", () => {
  afterEach(() => {
    cleanup();
    addAnimeEntryCalls.length = 0;
    addAnimeEntryResult = {};
    router.refresh = () => {};
  });

  it("highlights the current status as primary and others as secondary", () => {
    render(<StatusPicker anilistId={1} currentStatus="watching" />);
    const watchingButton = screen.getByRole("button", { name: "Watching" });
    const planButton = screen.getByRole("button", { name: "Plan to watch" });
    assert.match(watchingButton.className, /bg-accent/);
    assert.doesNotMatch(planButton.className, /bg-accent/);
  });

  it("calls addAnimeEntry and refreshes the router on success", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<StatusPicker anilistId={42} currentStatus={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Completed" }));

    await screen.findByRole("button", { name: "Completed" });
    assert.deepEqual(addAnimeEntryCalls, [{ anilistId: 42, status: "completed" }]);
    assert.equal(refreshed, true);
  });

  it("reverts the optimistic status when the action errors", async () => {
    addAnimeEntryResult = { error: "Something went wrong" };
    render(<StatusPicker anilistId={7} currentStatus="watching" />);
    fireEvent.click(screen.getByRole("button", { name: "Dropped" }));

    await new Promise((resolve) => setTimeout(resolve, 0));
    const watchingButton = screen.getByRole("button", { name: "Watching" });
    assert.match(watchingButton.className, /bg-accent/);
  });
});
