import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { AnimeEpisodeTicker as AnimeEpisodeTickerType } from "@/components/anime/anime-episode-ticker";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const updateCalls: Array<{ id: string; patch: unknown }> = [];
let updateResult: { error?: string } = {};

mock.module("@/actions/library", {
  namedExports: {
    updateAnimeEntry: async (id: string, patch: unknown) => {
      updateCalls.push({ id, patch });
      return updateResult;
    },
  },
});

let AnimeEpisodeTicker: typeof AnimeEpisodeTickerType;

before(async () => {
  ({ AnimeEpisodeTicker } = await import(
    "@/components/anime/anime-episode-ticker"
  ));
});

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    entryId: "entry-1",
    progressEpisodes: 5,
    totalEpisodes: 24,
    title: "Naruto",
    ...overrides,
  };
}

describe("AnimeEpisodeTicker", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    updateResult = {};
    router.refresh = () => {};
  });

  it("renders the details controls and jump editor trigger without a minus button", () => {
    render(<AnimeEpisodeTicker {...makeProps()} />);
    assert.equal(
      screen.queryByRole("button", { name: "Naruto: step back one episode" }),
      null,
    );
    screen.getByRole("button", { name: "Naruto: set episodes watched" });
    screen.getByRole("button", { name: "Naruto: log next episode watched" });
    screen.getByRole("progressbar", { name: "5 of 24 episodes watched" });
  });

  it("sets an exact count from the details editor", async () => {
    render(<AnimeEpisodeTicker {...makeProps()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: set episodes watched" }),
    );
    fireEvent.change(screen.getByLabelText("Naruto: episode count"), {
      target: { value: "13" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await settle();
    assert.deepEqual(updateCalls[0].patch, { progressEpisodes: 13 });
    screen.getByText("EP 13");
  });

  it("clamps a details-editor jump to the known total", async () => {
    render(<AnimeEpisodeTicker {...makeProps()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: set episodes watched" }),
    );
    fireEvent.change(screen.getByLabelText("Naruto: episode count"), {
      target: { value: "99" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await settle();
    assert.deepEqual(updateCalls[0].patch, { progressEpisodes: 24 });
  });

  it("supports Finish and Reset chips in the details editor", async () => {
    render(<AnimeEpisodeTicker {...makeProps()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: set episodes watched" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish (24)" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await settle();

    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: set episodes watched" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => assert.equal(updateCalls.length, 2));
    await settle();
    assert.deepEqual(updateCalls[1].patch, { progressEpisodes: 0 });
  });
});
