import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComparisonView as ComparisonViewType } from "@/components/ranking/comparison-view";
import type { SeriesComparisonPair } from "@/lib/ranking/prompt";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const submitCalls: Array<{ left: string; right: string; winner: string }> = [];
const skipCalls: Array<{ left: string; right: string; reason: string }> = [];
let actionResult: { error?: string } = {};

mock.module("@/actions/ranking", {
  namedExports: {
    submitComparison: async (left: string, right: string, winner: string) => {
      submitCalls.push({ left, right, winner });
      return actionResult;
    },
    skipComparison: async (left: string, right: string, reason: string) => {
      skipCalls.push({ left, right, reason });
      return actionResult;
    },
  },
});

let ComparisonView: typeof ComparisonViewType;

before(async () => {
  ({ ComparisonView } = await import("@/components/ranking/comparison-view"));
});

function makePair(): SeriesComparisonPair {
  return {
    left: {
      id: "left-1",
      canonical_title: "Naruto",
      cover_image_url: null,
      entryCount: 1,
    } as SeriesComparisonPair["left"],
    right: {
      id: "right-1",
      canonical_title: "One Piece",
      cover_image_url: null,
      entryCount: 3,
    } as SeriesComparisonPair["right"],
  };
}

describe("ComparisonView", () => {
  afterEach(() => {
    cleanup();
    submitCalls.length = 0;
    skipCalls.length = 0;
    actionResult = {};
    router.refresh = () => {};
  });

  it("shows both series titles and a multi-entry subtitle", () => {
    render(<ComparisonView pair={makePair()} />);
    screen.getByText("Naruto");
    screen.getByText("One Piece");
    screen.getByText("Series");
    screen.getByText("Series · 3 entries in your library");
  });

  it("submits the picked series as the winner and refreshes", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<ComparisonView pair={makePair()} />);
    fireEvent.click(screen.getByRole("button", { name: /Naruto/ }));
    await waitFor(() => assert.equal(submitCalls.length, 1));
    assert.deepEqual(submitCalls[0], {
      left: "left-1",
      right: "right-1",
      winner: "left-1",
    });
    await waitFor(() => assert.equal(refreshed, true));
  });

  it("skips with 'cannot_decide' and refreshes", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<ComparisonView pair={makePair()} />);
    fireEvent.click(screen.getByRole("button", { name: "Can't decide" }));
    await waitFor(() => assert.equal(skipCalls.length, 1));
    assert.deepEqual(skipCalls[0], {
      left: "left-1",
      right: "right-1",
      reason: "cannot_decide",
    });
    await waitFor(() => assert.equal(refreshed, true));
  });

  it("skips with 'not_comparable'", async () => {
    render(<ComparisonView pair={makePair()} />);
    fireEvent.click(screen.getByRole("button", { name: "Not comparable" }));
    await waitFor(() => assert.equal(skipCalls.length, 1));
    assert.equal(skipCalls[0].reason, "not_comparable");
  });

  it("shows an error instead of refreshing when the action fails", async () => {
    actionResult = { error: "Could not save" };
    render(<ComparisonView pair={makePair()} />);
    fireEvent.click(screen.getByRole("button", { name: /Naruto/ }));
    await screen.findByRole("alert");
    screen.getByText("Could not save");
  });
});
