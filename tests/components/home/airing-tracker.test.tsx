import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import type {
  AiringTracker as AiringTrackerType,
  AiringTrackerSkeleton as AiringTrackerSkeletonType,
} from "@/components/home/airing-tracker";
import type { AiringRow } from "@/lib/anime/airing";

import { installRouterMock } from "../../helpers/mock-router";

installRouterMock();

// AiringRowItem imports the `updateAnimeEntry` Server Action, which
// transitively imports `@/lib/supabase/admin` — guarded by
// `import "server-only"`, which throws outside a react-server module
// context. Stub the marker package before dynamically importing the
// component under test below.
mock.module("server-only", { namedExports: {} });

let airingRows: AiringRow[] | Error = [];

mock.module("@/lib/anime/airing-fetch", {
  namedExports: {
    getAiringForWatching: async () => {
      if (airingRows instanceof Error) throw airingRows;
      return airingRows;
    },
  },
});

let AiringTracker: typeof AiringTrackerType;
let AiringTrackerSkeleton: typeof AiringTrackerSkeletonType;

before(async () => {
  ({ AiringTracker, AiringTrackerSkeleton } = await import(
    "@/components/home/airing-tracker"
  ));
});

function makeRow(overrides: Partial<AiringRow> = {}): AiringRow {
  return {
    entryId: "entry-1",
    anilistId: 20,
    title: "Naruto",
    coverUrl: null,
    nextEpisodeNumber: 5,
    airingAt: Math.floor(Date.now() / 1000) + 3600,
    episodesBehind: 0,
    progressEpisodes: 3,
    totalEpisodes: null,
    ...overrides,
  };
}

describe("AiringTracker", () => {
  afterEach(() => {
    cleanup();
    airingRows = [];
  });

  it("shows a browse-season prompt when nothing is airing", async () => {
    airingRows = [];
    const element = await AiringTracker({ userId: "u1" });
    render(element);
    screen.getByText(/Nothing you're watching is currently airing/);
    screen.getByRole("link", { name: "browse this season" });
  });

  it("lists each airing row", async () => {
    airingRows = [makeRow({ entryId: "1", title: "Naruto" }), makeRow({ entryId: "2", title: "One Piece" })];
    const element = await AiringTracker({ userId: "u1" });
    render(element);
    screen.getByText("Naruto");
    screen.getByText("One Piece");
  });

  it("shows the empty state when the fetch throws", async () => {
    airingRows = new Error("boom");
    const element = await AiringTracker({ userId: "u1" });
    render(element);
    screen.getByText(/Nothing you're watching is currently airing/);
  });
});

describe("AiringTrackerSkeleton", () => {
  it("renders two placeholder rows", () => {
    const { container } = render(<AiringTrackerSkeleton />);
    assert.equal(container.querySelectorAll("li").length, 2);
    cleanup();
  });
});
