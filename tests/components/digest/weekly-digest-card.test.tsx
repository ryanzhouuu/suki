import assert from "node:assert/strict";
import test from "node:test";

import { render, screen } from "@testing-library/react";

import { WeeklyDigestCard } from "@/components/digest/weekly-digest-card";
import type { DigestSnapshot } from "@/lib/digest/snapshot";

function digest(quiet: boolean): DigestSnapshot {
  return {
    id: "digest-1",
    user_id: "user-1",
    week_start: "2026-07-27",
    week_end: "2026-08-03",
    timezone: "America/Chicago",
    content_version: 1,
    generated_at: "2026-08-03T06:00:00Z",
    viewed_at: null,
    dismissed_at: null,
    summary: {
      version: 1,
      totals: {
        episodesWatched: quiet ? 0 : 8,
        titlesStarted: quiet ? 0 : 1,
        titlesCompleted: quiet ? 0 : 2,
        comparisons: 0,
        recommendationInteractions: 0,
      },
      highlights: [],
      recommendationAnimeIds: [],
      quiet,
    },
  };
}

test("renders an active digest with labeled totals and accessible dismissal", () => {
  render(<WeeklyDigestCard digest={digest(false)} />);
  assert.ok(screen.getByText(/8 episodes/));
  assert.ok(screen.getByRole("link", { name: /read the edition/i }));
  assert.ok(
    screen.getByRole("button", {
      name: /dismiss weekly recap for jul 27–aug 2, 2026/i,
    }),
  );
});

test("renders quiet-week copy without zero-heavy totals", () => {
  render(<WeeklyDigestCard digest={digest(true)} />);
  assert.ok(screen.getByText("Ready for what’s next?"));
  assert.equal(screen.queryByText("0 episodes"), null);
});
