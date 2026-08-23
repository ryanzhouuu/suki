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
import type {
  EpisodeProgressReadout as EpisodeProgressReadoutType,
  EpisodeTicker as EpisodeTickerType,
} from "@/components/library/episode-ticker";

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

let EpisodeTicker: typeof EpisodeTickerType;
let EpisodeProgressReadout: typeof EpisodeProgressReadoutType;

before(async () => {
  ({ EpisodeTicker, EpisodeProgressReadout } = await import(
    "@/components/library/episode-ticker"
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
    ...overrides,
  };
}


describe("EpisodeTicker (full)", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    updateResult = {};
    router.refresh = () => {};
  });

  it("renders the count, strip, step-back, and log controls", () => {
    render(<EpisodeTicker {...makeProps()} />);
    screen.getByText("EP 5");
    screen.getByRole("progressbar", { name: "5 of 24 episodes watched" });
    screen.getByRole("button", { name: "+ Episode" });
    assert.equal(
      (
        screen.getByRole("button", {
          name: "step back one episode",
        }) as HTMLButtonElement
      ).disabled,
      false,
    );
  });

  it("disables step-back at zero progress", () => {
    render(<EpisodeTicker {...makeProps({ progressEpisodes: 0 })} />);
    const stepBack = screen.getByRole("button", {
      name: "step back one episode",
    }) as HTMLButtonElement;
    assert.equal(stepBack.disabled, true);
  });

  it("logs the next episode optimistically and refreshes on success", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<EpisodeTicker {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Episode" }));
    screen.getByText("EP 6");
    await waitFor(() => assert.equal(refreshed, true));
    await settle();
    assert.deepEqual(updateCalls, [
      { id: "entry-1", patch: { progressEpisodes: 6 } },
    ]);
  });

  it("coalesces rapid taps into a trailing save", async () => {
    render(<EpisodeTicker {...makeProps()} />);
    const button = screen.getByRole("button", { name: "+ Episode" });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => assert.equal(updateCalls.length, 2));
    await settle();
    assert.deepEqual(updateCalls, [
      { id: "entry-1", patch: { progressEpisodes: 6 } },
      { id: "entry-1", patch: { progressEpisodes: 8 } },
    ]);
    screen.getByText("EP 8");
  });

  it("reverts to the server value and offers retry when the save fails", async () => {
    updateResult = { error: "failed" };
    render(<EpisodeTicker {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Episode" }));
    await waitFor(() => screen.getByText("Couldn’t save"));
    screen.getByText("EP 5");

    updateResult = {};
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => assert.equal(updateCalls.length, 2));
    await settle();
    assert.deepEqual(updateCalls[1].patch, { progressEpisodes: 6 });
  });

  it("offers undo after a successful log and steps back through the action", async () => {
    render(<EpisodeTicker {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Episode" }));
    await waitFor(() => screen.getByText(/Ep 6 logged/));

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => assert.equal(updateCalls.length, 2));
    await settle();
    assert.deepEqual(updateCalls[1].patch, { progressEpisodes: 5 });
    screen.getByText("EP 5");
  });

  it("sets an exact count via the jump editor", async () => {
    render(<EpisodeTicker {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "set episodes watched" }));
    const input = screen.getByLabelText("episode count");
    fireEvent.change(input, { target: { value: "13" } });
    fireEvent.click(screen.getByRole("button", { name: "Set" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await settle();
    assert.deepEqual(updateCalls[0].patch, { progressEpisodes: 13 });
    screen.getByText("EP 13");
    assert.equal(screen.queryByLabelText("episode count"), null);
  });

  it("clamps editor values above the total before saving", async () => {
    render(<EpisodeTicker {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "set episodes watched" }));
    fireEvent.change(screen.getByLabelText("episode count"), {
      target: { value: "99" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await settle();
    assert.deepEqual(updateCalls[0].patch, { progressEpisodes: 24 });
  });

  it("jumps to the total via the Finish chip and resets via Reset", async () => {
    render(<EpisodeTicker {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "set episodes watched" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish (24)" }));
    await waitFor(() => assert.equal(updateCalls.length, 1));
    await settle();
    assert.deepEqual(updateCalls[0].patch, { progressEpisodes: 24 });

    fireEvent.click(screen.getByRole("button", { name: "set episodes watched" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => assert.equal(updateCalls.length, 2));
    await settle();
    assert.deepEqual(updateCalls[1].patch, { progressEpisodes: 0 });
    screen.getByText("EP 0");
  });

  it("closes the editor on Escape without saving", () => {
    render(<EpisodeTicker {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "set episodes watched" }));
    fireEvent.keyDown(screen.getByLabelText("episode count"), { key: "Escape" });
    assert.equal(screen.queryByLabelText("episode count"), null);
    assert.equal(updateCalls.length, 0);
  });

  it("swaps the log button for a disabled Done state at the total", () => {
    render(<EpisodeTicker {...makeProps({ progressEpisodes: 24 })} />);
    const done = screen.getByRole("button", { name: "Done" }) as HTMLButtonElement;
    assert.equal(done.disabled, true);
    assert.equal(
      screen.queryByRole("button", { name: "+ Episode" }),
      null,
    );
  });

  it("handles unknown totals with a dashed strip and no Finish chip", () => {
    render(<EpisodeTicker {...makeProps({ totalEpisodes: null })} />);
    assert.equal(screen.queryByRole("progressbar"), null);
    screen.getByText("EP 5");
    fireEvent.click(screen.getByRole("button", { name: "set episodes watched" }));
    assert.equal(screen.queryByRole("button", { name: /Finish/ }), null);
    assert.equal(
      (screen.getByLabelText("episode count") as HTMLInputElement).max,
      "",
    );
  });
});

describe("EpisodeTicker (compact)", () => {
  afterEach(() => {
    cleanup();
    updateCalls.length = 0;
    updateResult = {};
    router.refresh = () => {};
  });

  it("renders only the log control without the editor", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(
      <EpisodeTicker
        {...makeProps()}
        variant="compact"
        title="Naruto"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Naruto: log next episode watched" }),
    );
    assert.equal(screen.queryByRole("button", { name: /set episodes watched/ }), null);
    await waitFor(() => assert.equal(refreshed, true));
    await settle();
    assert.deepEqual(updateCalls, [
      { id: "entry-1", patch: { progressEpisodes: 6 } },
    ]);
  });

  it("shows a disabled Done state at the total", () => {
    render(<EpisodeTicker {...makeProps({ progressEpisodes: 24 })} variant="compact" />);
    const done = screen.getByRole("button", { name: "Done" }) as HTMLButtonElement;
    assert.equal(done.disabled, true);
  });
});

describe("EpisodeProgressReadout", () => {
  afterEach(() => cleanup());

  it("shows the count with the strip and a done marker", () => {
    render(
      <EpisodeProgressReadout
        progressEpisodes={220}
        totalEpisodes={220}
        done
      />,
    );
    screen.getByText(/220 \/ 220 episodes/);
    screen.getByText(/Done ·/);
    screen.getByRole("progressbar", { name: "220 of 220 episodes watched" });
  });

  it("falls back to a plain count for unknown totals", () => {
    render(<EpisodeProgressReadout progressEpisodes={7} totalEpisodes={null} />);
    screen.getByText("7 episodes");
    assert.equal(screen.queryByRole("progressbar"), null);
  });
});
