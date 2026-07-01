import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { ProfileStatsPanel } from "@/components/profile/profile-stats-panel";
import type {
  ProfileLibraryStats,
  ProfileRankingStats,
  ProfileTasteSummary,
  ProfileWatchStyle,
} from "@/lib/profiles/stats";

const emptyLibrary: ProfileLibraryStats = {
  total: 0,
  watching: 0,
  completed: 0,
  paused: 0,
  dropped: 0,
  plan_to_watch: 0,
};

const emptyTaste: ProfileTasteSummary = {
  topGenres: [],
  averagePersonalScore: null,
  completedCount: 0,
};

const emptyRanking: ProfileRankingStats = {
  totalRanked: 0,
  confidence: { low: 0, medium: 0, high: 0 },
};

const emptyWatchStyle: ProfileWatchStyle = {
  topFormats: [],
  shortSeriesShare: null,
  genreCompletionRates: [],
};

describe("ProfileStatsPanel", () => {
  it("shows an empty state when there's no data at all", () => {
    render(
      <ProfileStatsPanel
        library={emptyLibrary}
        taste={emptyTaste}
        ranking={emptyRanking}
        watchStyle={emptyWatchStyle}
      />,
    );
    screen.getByText(/No library or ranking data yet/);
    cleanup();
  });

  it("shows headline metrics for tracked, completed, ranked, and avg score", () => {
    render(
      <ProfileStatsPanel
        library={{ ...emptyLibrary, total: 20, completed: 12, watching: 8 }}
        taste={{ ...emptyTaste, averagePersonalScore: 8.5 }}
        ranking={{ ...emptyRanking, totalRanked: 6 }}
        watchStyle={emptyWatchStyle}
      />,
    );
    screen.getByText("20");
    screen.getByText("Tracked");
    // "12"/"Completed" also appear in the status-breakdown card below.
    assert.equal(screen.getAllByText("12").length, 2);
    assert.equal(screen.getAllByText("Completed").length, 2);
    screen.getByText("6");
    screen.getByText("Ranked");
    screen.getByText("8.5");
    screen.getByText("Avg score");
    cleanup();
  });

  it("shows the top genres card only when there are genres", () => {
    render(
      <ProfileStatsPanel
        library={emptyLibrary}
        taste={{ ...emptyTaste, topGenres: [{ genre: "Action", count: 5 }] }}
        ranking={emptyRanking}
        watchStyle={emptyWatchStyle}
      />,
    );
    screen.getByText("Top genres");
    screen.getByText("Action");
    cleanup();
  });

  it("shows the library status breakdown only for non-zero statuses", () => {
    // completed left at 0 so the headline "Completed" metric doesn't also
    // render and collide with the breakdown row of the same name.
    render(
      <ProfileStatsPanel
        library={{ ...emptyLibrary, total: 10, watching: 4, paused: 6 }}
        taste={emptyTaste}
        ranking={emptyRanking}
        watchStyle={emptyWatchStyle}
      />,
    );
    screen.getByText("Status breakdown");
    screen.getByText("Watching");
    screen.getByText("Paused");
    assert.equal(screen.queryByText("Dropped"), null);
    cleanup();
  });

  it("shows ranking confidence only for non-zero levels", () => {
    render(
      <ProfileStatsPanel
        library={emptyLibrary}
        taste={emptyTaste}
        ranking={{ totalRanked: 5, confidence: { low: 0, medium: 2, high: 3 } }}
        watchStyle={emptyWatchStyle}
      />,
    );
    screen.getByText("Confidence");
    screen.getByText("Getting clearer");
    screen.getByText("Well established");
    assert.equal(screen.queryByText("Needs more comparisons"), null);
    cleanup();
  });

  it("shows watch style formats and genre completion rates", () => {
    render(
      <ProfileStatsPanel
        library={emptyLibrary}
        taste={emptyTaste}
        ranking={emptyRanking}
        watchStyle={{
          topFormats: [{ format: "TV", count: 10 }],
          shortSeriesShare: 25,
          genreCompletionRates: [{ genre: "Action", rate: 80, started: 5 }],
        }}
      />,
    );
    screen.getByText("How they watch");
    screen.getByText("TV");
    screen.getByText("Completion by genre");
    screen.getByText("80%");
    screen.getByText("25%");
    screen.getByText("Short series");
    cleanup();
  });

  it("renders the activitySlot when provided", () => {
    render(
      <ProfileStatsPanel
        library={{ ...emptyLibrary, total: 1 }}
        taste={emptyTaste}
        ranking={emptyRanking}
        watchStyle={emptyWatchStyle}
        activitySlot={<div>Activity slot content</div>}
      />,
    );
    screen.getByText("Activity slot content");
    cleanup();
  });
});
