import assert from "node:assert/strict";
import test from "node:test";

import { buildDigestSummary, parseDigestSummary } from "@/lib/digest/aggregate";
import { USER_EVENT_TYPES } from "@/lib/constants";

const event = (
  id: string,
  eventType: string,
  animeId: string | null,
  metadata: Record<string, unknown> = {},
) => ({
  id,
  eventType,
  animeId,
  metadata,
  createdAt: `2026-08-0${id.length}T12:00:00Z`,
});

test("aggregates reliable activity and deduplicates anime achievements", () => {
  const summary = buildDigestSummary([
    event("1", USER_EVENT_TYPES.animeAdded, "a", { status: "watching" }),
    event("22", USER_EVENT_TYPES.statusChanged, "a", { to: "watching" }),
    event("333", USER_EVENT_TYPES.progressUpdated, "a", {
      previousProgress: 2,
      progress: 5,
      delta: 3,
    }),
    event("4444", USER_EVENT_TYPES.animeCompleted, "b"),
    event("55555", USER_EVENT_TYPES.animeCompleted, "b"),
    event("666666", USER_EVENT_TYPES.seriesComparisonCreated, null),
    event("7777777", USER_EVENT_TYPES.recommendationClicked, "c"),
    event("88888888", USER_EVENT_TYPES.recommendationAdded, "c"),
  ]);

  assert.deepEqual(summary.totals, {
    episodesWatched: 3,
    titlesStarted: 1,
    titlesCompleted: 1,
    comparisons: 1,
    recommendationInteractions: 1,
  });
  assert.deepEqual(
    summary.highlights.map((highlight) => [highlight.animeId, highlight.kind]),
    [
      ["b", "completed"],
      ["a", "started"],
    ],
  );
  assert.equal(summary.quiet, false);
});

test("excludes imports and does not guess legacy episode progress", () => {
  const summary = buildDigestSummary([
    event("1", USER_EVENT_TYPES.animeAdded, "a", {
      status: "watching",
      source: "import",
    }),
    event("22", USER_EVENT_TYPES.progressUpdated, "b", { progress: 4 }),
    event("333", USER_EVENT_TYPES.progressUpdated, "c", {
      previousProgress: 8,
      progress: 6,
      delta: -2,
    }),
  ]);
  assert.equal(summary.totals.titlesStarted, 0);
  assert.equal(summary.totals.episodesWatched, null);
  assert.equal(summary.quiet, true);
});

test("parses only the current content version", () => {
  const summary = buildDigestSummary([]);
  assert.deepEqual(parseDigestSummary(summary), summary);
  assert.equal(parseDigestSummary({ ...summary, version: 2 }), null);
});
