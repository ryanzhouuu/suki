import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type AnimeDetailErrorType from "@/app/anime/[anilistId]/error";

let AnimeDetailError: typeof AnimeDetailErrorType;

before(async () => {
  AnimeDetailError = (await import("@/app/anime/[anilistId]/error")).default;
});

describe("AnimeDetailError", () => {
  afterEach(cleanup);

  it("renders a retry affordance", () => {
    render(<AnimeDetailError error={new Error("boom")} reset={() => {}} />);
    screen.getByRole("button", { name: "Try again" });
    screen.getByText("Couldn't load this anime");
  });

  it("calls reset() when the retry button is clicked", () => {
    let resetCalls = 0;
    render(
      <AnimeDetailError error={new Error("boom")} reset={() => { resetCalls++; }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    assert.equal(resetCalls, 1);
  });
});
