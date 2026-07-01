import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { RerankButton as RerankButtonType } from "@/components/ranking/rerank-button";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const resetCalls: string[] = [];
let resetResult: { error?: string } = {};

mock.module("@/actions/ranking", {
  namedExports: {
    resetSeriesRanking: async (seriesId: string) => {
      resetCalls.push(seriesId);
      return resetResult;
    },
  },
});

let RerankButton: typeof RerankButtonType;

before(async () => {
  ({ RerankButton } = await import("@/components/ranking/rerank-button"));
});

describe("RerankButton", () => {
  afterEach(() => {
    cleanup();
    resetCalls.length = 0;
    resetResult = {};
    router.refresh = () => {};
    delete (window as unknown as { confirm?: unknown }).confirm;
  });

  it("does nothing when the confirm dialog is declined", () => {
    window.confirm = () => false;
    render(<RerankButton seriesId="s1" title="Naruto" />);
    fireEvent.click(screen.getByRole("button", { name: "Re-rank" }));
    assert.deepEqual(resetCalls, []);
  });

  it("resets the ranking and refreshes when confirmed", async () => {
    window.confirm = () => true;
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<RerankButton seriesId="s1" title="Naruto" />);
    fireEvent.click(screen.getByRole("button", { name: "Re-rank" }));
    await waitFor(() => assert.equal(refreshed, true));
    assert.deepEqual(resetCalls, ["s1"]);
  });

  it("shows an error instead of refreshing when the action fails", async () => {
    window.confirm = () => true;
    resetResult = { error: "Could not reset" };
    render(<RerankButton seriesId="s1" title="Naruto" />);
    fireEvent.click(screen.getByRole("button", { name: "Re-rank" }));
    await screen.findByRole("alert");
    screen.getByText("Could not reset");
  });
});
