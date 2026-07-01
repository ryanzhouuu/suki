import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SeriesOverridesAdmin as SeriesOverridesAdminType } from "@/components/admin/series-overrides-admin";
import type {
  AdminAnimeSearchHit,
  AdminSeriesSearchHit,
  OverrideListItem,
  SeriesAdminActionState,
} from "@/actions/series-admin";

import { installRouterMock } from "../../helpers/mock-router";

const router = installRouterMock();

const saveCalls: FormData[] = [];
const removeCalls: number[] = [];
const animeSearchCalls: string[] = [];
const seriesSearchCalls: string[] = [];
let saveResult: SeriesAdminActionState = {};
let removeResult: SeriesAdminActionState = {};
let animeHitsResult: AdminAnimeSearchHit[] = [];
let seriesHitsResult: AdminSeriesSearchHit[] = [];

mock.module("@/actions/series-admin", {
  namedExports: {
    saveSeriesOverride: async (_prev: SeriesAdminActionState, formData: FormData) => {
      saveCalls.push(formData);
      return saveResult;
    },
    removeSeriesOverride: async (anilistId: number) => {
      removeCalls.push(anilistId);
      return removeResult;
    },
    searchAnimeForSeriesAdmin: async (q: string) => {
      animeSearchCalls.push(q);
      return animeHitsResult;
    },
    searchSeriesForSeriesAdmin: async (q: string) => {
      seriesSearchCalls.push(q);
      return seriesHitsResult;
    },
  },
});

let SeriesOverridesAdmin: typeof SeriesOverridesAdminType;

before(async () => {
  ({ SeriesOverridesAdmin } = await import(
    "@/components/admin/series-overrides-admin"
  ));
});

function makeOverride(overrides: Partial<OverrideListItem> = {}): OverrideListItem {
  return {
    override: {
      id: "override-1",
      anilist_id: 20,
      action: "force_series",
      target_series_id: "series-1",
      target_anilist_primary_id: null,
      notes: null,
    } as OverrideListItem["override"],
    animeTitle: "Naruto",
    targetSeriesTitle: "Naruto Shippuden",
    ...overrides,
  };
}

describe("SeriesOverridesAdmin", () => {
  afterEach(() => {
    cleanup();
    saveCalls.length = 0;
    removeCalls.length = 0;
    animeSearchCalls.length = 0;
    seriesSearchCalls.length = 0;
    saveResult = {};
    removeResult = {};
    animeHitsResult = [];
    seriesHitsResult = [];
    router.refresh = () => {};
  });

  it("shows 'No manual overrides yet.' when there are none", () => {
    render(<SeriesOverridesAdmin initialOverrides={[]} />);
    screen.getByText("No manual overrides yet.");
  });

  it("lists an existing override with its target and action label", () => {
    render(<SeriesOverridesAdmin initialOverrides={[makeOverride()]} />);
    screen.getByText("Naruto");
    screen.getByText("AniList 20 · Force into series → Naruto Shippuden", {
      exact: false,
    });
  });

  it("shows the target-series fields only for the force_series action", () => {
    render(<SeriesOverridesAdmin initialOverrides={[]} />);
    screen.getByLabelText("Target series");
    fireEvent.change(screen.getByLabelText("Action"), {
      target: { value: "force_singleton" },
    });
    assert.equal(screen.queryByLabelText("Target series"), null);
  });

  it("searches anime after typing 2+ characters and selecting a hit fills the AniList ID", async () => {
    animeHitsResult = [
      {
        anilistId: 20,
        title: "Naruto",
        format: "TV",
        source: "cache",
        currentSeriesTitle: null,
        currentSeriesId: null,
      },
    ];
    render(<SeriesOverridesAdmin initialOverrides={[]} />);
    fireEvent.change(screen.getByLabelText("Anime (search or AniList ID)"), {
      target: { value: "naruto" },
    });
    await waitFor(() => assert.equal(animeSearchCalls.length, 1), { timeout: 1000 });
    fireEvent.click(await screen.findByRole("button", { name: /Naruto/ }));
    assert.equal(
      (screen.getByLabelText("AniList ID") as HTMLInputElement).value,
      "20",
    );
  });

  it("searches series and selecting a hit fills the target fields", async () => {
    seriesHitsResult = [
      { id: "series-1", canonicalTitle: "Naruto Shippuden", anilistPrimaryId: 21, memberCount: 3 },
    ];
    render(<SeriesOverridesAdmin initialOverrides={[]} />);
    fireEvent.change(screen.getByLabelText("Target series"), {
      target: { value: "shippuden" },
    });
    await waitFor(() => assert.equal(seriesSearchCalls.length, 1), { timeout: 1000 });
    fireEvent.click(await screen.findByRole("button", { name: /Naruto Shippuden/ }));
    assert.equal(
      (screen.getByLabelText("Target series UUID") as HTMLInputElement).value,
      "series-1",
    );
    assert.equal(
      (screen.getByLabelText("Target primary AniList ID") as HTMLInputElement).value,
      "21",
    );
  });

  it("submits the form and refreshes the router on success", async () => {
    saveResult = { success: "Override saved" };
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<SeriesOverridesAdmin initialOverrides={[]} />);
    fireEvent.change(screen.getByLabelText("AniList ID"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save & apply override" }));
    await waitFor(() => assert.equal(saveCalls.length, 1));
    assert.equal(saveCalls[0].get("anilist_id"), "20");
    await waitFor(() => assert.equal(refreshed, true));
    screen.getByText("Override saved");
  });

  it("shows a save error without refreshing", async () => {
    saveResult = { error: "Invalid override" };
    render(<SeriesOverridesAdmin initialOverrides={[]} />);
    fireEvent.change(screen.getByLabelText("AniList ID"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save & apply override" }));
    await screen.findByRole("alert");
    screen.getByText("Invalid override");
  });

  it("removes an override, hides it from the list, and refreshes", async () => {
    let refreshed = false;
    router.refresh = () => {
      refreshed = true;
    };
    render(<SeriesOverridesAdmin initialOverrides={[makeOverride()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove & re-auto" }));
    await waitFor(() => assert.deepEqual(removeCalls, [20]));
    await waitFor(() => assert.equal(screen.queryByText("Naruto"), null));
    assert.equal(refreshed, true);
  });

  it("shows a remove error and keeps the entry when removal fails", async () => {
    removeResult = { error: "Could not remove" };
    render(<SeriesOverridesAdmin initialOverrides={[makeOverride()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove & re-auto" }));
    await screen.findByText("Could not remove");
    screen.getByText("Naruto");
  });
});
