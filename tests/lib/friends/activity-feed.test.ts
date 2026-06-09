import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildFeedItems,
  describeActivity,
  type AnimeRef,
  type FeedActor,
  type FeedEventRow,
  type FeedLookups,
  type SeriesRef,
} from "@/lib/friends/activity-feed";

const ACTOR_A: FeedActor = {
  userId: "user-a",
  username: "ash",
  displayName: "Ash",
  avatarUrl: null,
};
const ACTOR_B: FeedActor = {
  userId: "user-b",
  username: "misty",
  displayName: null,
  avatarUrl: "https://img/misty.jpg",
};

function animeRef(n: number): AnimeRef {
  return {
    animeId: `anime-${n}`,
    anilistId: 1000 + n,
    title: `Anime ${n}`,
    coverImageUrl: `https://img/${n}.jpg`,
  };
}

function seriesRef(n: number): SeriesRef {
  return {
    seriesId: `series-${n}`,
    anilistPrimaryId: 5000 + n,
    title: `Series ${n}`,
    coverImageUrl: `https://img/s${n}.jpg`,
  };
}

function lookups(over: Partial<FeedLookups> = {}): FeedLookups {
  return {
    actors: new Map([
      [ACTOR_A.userId, ACTOR_A],
      [ACTOR_B.userId, ACTOR_B],
    ]),
    anime: new Map(
      Array.from({ length: 10 }, (_, i) => animeRef(i + 1)).map((r) => [
        r.animeId,
        r,
      ]),
    ),
    series: new Map(
      Array.from({ length: 5 }, (_, i) => seriesRef(i + 1)).map((r) => [
        r.seriesId,
        r,
      ]),
    ),
    rankByActorSeries: new Map(),
    ...over,
  };
}

let eventSeq = 0;
function row(over: Partial<FeedEventRow>): FeedEventRow {
  eventSeq += 1;
  return {
    id: `evt-${eventSeq}`,
    userId: ACTOR_A.userId,
    eventType: "anime_completed",
    animeId: "anime-1",
    metadata: {},
    createdAt: "2026-06-09T12:00:00.000Z",
    ...over,
  };
}

const BASE = new Date("2026-06-09T12:00:00.000Z").getTime();
function at(offsetMs: number): string {
  return new Date(BASE - offsetMs).toISOString();
}
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe("buildFeedItems — classification", () => {
  it("maps anime_completed to a completed item", () => {
    const items = buildFeedItems(
      [row({ eventType: "anime_completed", animeId: "anime-1" })],
      lookups(),
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "completed");
    assert.equal(items[0].count, 1);
    assert.equal(items[0].refs[0].kind, "anime");
    assert.equal(items[0].refs[0].href, "/anime/1001");
  });

  it("maps anime_added with plan_to_watch status to a planned item", () => {
    const items = buildFeedItems(
      [
        row({
          eventType: "anime_added",
          animeId: "anime-2",
          metadata: { status: "plan_to_watch" },
        }),
      ],
      lookups(),
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "planned");
  });

  it("drops anime_added that is not plan_to_watch", () => {
    const items = buildFeedItems(
      [
        row({
          eventType: "anime_added",
          animeId: "anime-2",
          metadata: { status: "watching" },
        }),
      ],
      lookups(),
    );
    assert.equal(items.length, 0);
  });

  it("drops low-signal event types", () => {
    const items = buildFeedItems(
      [
        row({ eventType: "progress_updated" }),
        row({ eventType: "status_changed" }),
        row({ eventType: "recommendation_viewed" }),
        row({ eventType: "ranking_viewed" }),
      ],
      lookups(),
    );
    assert.equal(items.length, 0);
  });

  it("drops events from actors not in the allowed set (private/opted-out)", () => {
    const items = buildFeedItems(
      [row({ userId: "stranger", eventType: "anime_completed" })],
      lookups(),
    );
    assert.equal(items.length, 0);
  });

  it("drops events whose anime ref cannot be resolved", () => {
    const items = buildFeedItems(
      [row({ eventType: "anime_completed", animeId: "missing" })],
      lookups(),
    );
    assert.equal(items.length, 0);
  });
});

describe("buildFeedItems — ranking (top-5 gating)", () => {
  it("surfaces a comparison only when the winner is currently top-ranked, carrying the rank", () => {
    const items = buildFeedItems(
      [
        row({
          userId: ACTOR_A.userId,
          eventType: "series_comparison_created",
          animeId: null,
          metadata: {
            leftSeriesId: "series-1",
            rightSeriesId: "series-2",
            winnerSeriesId: "series-1",
          },
        }),
      ],
      lookups({
        rankByActorSeries: new Map([[`${ACTOR_A.userId}:series-1`, 1]]),
      }),
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "ranked");
    assert.equal(items[0].rank, 1);
    assert.equal(items[0].refs[0].kind, "series");
    assert.equal(items[0].refs[0].href, "/anime/5001");
  });

  it("drops a comparison whose winner is not currently top-ranked", () => {
    const items = buildFeedItems(
      [
        row({
          eventType: "series_comparison_created",
          animeId: null,
          metadata: {
            leftSeriesId: "series-1",
            rightSeriesId: "series-2",
            winnerSeriesId: "series-2",
          },
        }),
      ],
      lookups({
        rankByActorSeries: new Map([[`${ACTOR_A.userId}:series-1`, 1]]),
      }),
    );
    assert.equal(items.length, 0);
  });

  it("dedupes repeated comparisons of the same series into one card (most recent)", () => {
    const items = buildFeedItems(
      [
        row({
          createdAt: at(0),
          eventType: "series_comparison_created",
          animeId: null,
          metadata: { winnerSeriesId: "series-3" },
        }),
        row({
          createdAt: at(HOUR),
          eventType: "series_comparison_created",
          animeId: null,
          metadata: { winnerSeriesId: "series-3" },
        }),
      ],
      lookups({
        rankByActorSeries: new Map([[`${ACTOR_A.userId}:series-3`, 2]]),
      }),
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].count, 1);
    assert.equal(items[0].createdAt, at(0));
  });

  it("keeps distinct top series as separate cards", () => {
    const items = buildFeedItems(
      [
        row({
          eventType: "series_comparison_created",
          animeId: null,
          metadata: { winnerSeriesId: "series-1" },
        }),
        row({
          eventType: "series_comparison_created",
          animeId: null,
          metadata: { winnerSeriesId: "series-2" },
        }),
      ],
      lookups({
        rankByActorSeries: new Map([
          [`${ACTOR_A.userId}:series-1`, 1],
          [`${ACTOR_A.userId}:series-2`, 3],
        ]),
      }),
    );
    assert.equal(items.length, 2);
  });
});

describe("buildFeedItems — burst grouping", () => {
  it("collapses a burst of same-kind events from one actor into a single counted item", () => {
    const items = buildFeedItems(
      [
        row({ createdAt: at(0), animeId: "anime-1" }),
        row({ createdAt: at(MINUTE), animeId: "anime-2" }),
        row({ createdAt: at(2 * MINUTE), animeId: "anime-3" }),
      ],
      lookups(),
      { maxCovers: 4 },
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "completed");
    assert.equal(items[0].count, 3);
    assert.equal(items[0].createdAt, at(0));
  });

  it("caps the number of covers but keeps the true count", () => {
    const items = buildFeedItems(
      Array.from({ length: 6 }, (_, i) =>
        row({ createdAt: at(i * MINUTE), animeId: `anime-${i + 1}` }),
      ),
      lookups(),
      { maxCovers: 4 },
    );
    assert.equal(items[0].count, 6);
    assert.equal(items[0].refs.length, 4);
  });

  it("does not group events spread beyond the burst window", () => {
    const items = buildFeedItems(
      [
        row({ createdAt: at(0), animeId: "anime-1" }),
        row({ createdAt: at(2 * HOUR), animeId: "anime-2" }),
      ],
      lookups(),
      { groupWindowMs: 30 * MINUTE },
    );
    assert.equal(items.length, 2);
    assert.equal(items[0].count, 1);
    assert.equal(items[1].count, 1);
  });

  it("does not merge different actors", () => {
    const items = buildFeedItems(
      [
        row({ userId: ACTOR_A.userId, createdAt: at(0), animeId: "anime-1" }),
        row({
          userId: ACTOR_B.userId,
          createdAt: at(MINUTE),
          animeId: "anime-2",
        }),
      ],
      lookups(),
    );
    assert.equal(items.length, 2);
  });
});

describe("buildFeedItems — imports", () => {
  it("collapses an import burst into one item, deduping the added+completed pair per title", () => {
    const rows: FeedEventRow[] = [];
    for (let i = 1; i <= 3; i += 1) {
      rows.push(
        row({
          createdAt: at(i * 1000),
          eventType: "anime_added",
          animeId: `anime-${i}`,
          metadata: { source: "import", status: "completed" },
        }),
        row({
          createdAt: at(i * 1000 + 100),
          eventType: "anime_completed",
          animeId: `anime-${i}`,
          metadata: { source: "import" },
        }),
      );
    }
    const items = buildFeedItems(rows, lookups());
    assert.equal(items.length, 1);
    assert.equal(items[0].kind, "imported");
    assert.equal(items[0].count, 3);
  });
});

describe("describeActivity", () => {
  const single = (kind: string, ref: AnimeRef | SeriesRef, rank?: number) =>
    describeActivity({
      id: "x",
      actor: ACTOR_A,
      kind: kind as never,
      createdAt: at(0),
      count: 1,
      refs: [
        {
          kind: "animeId" in ref ? "anime" : "series",
          title: ref.title,
          coverImageUrl: ref.coverImageUrl,
          href: "/anime/1",
        },
      ],
      rank,
    });

  it("describes singular and plural completions", () => {
    assert.equal(single("completed", animeRef(1)), "Completed Anime 1");
    assert.equal(
      describeActivity({
        id: "x",
        actor: ACTOR_A,
        kind: "completed",
        createdAt: at(0),
        count: 5,
        refs: [],
      }),
      "Completed 5 anime",
    );
  });

  it("describes plan-to-watch additions", () => {
    assert.equal(
      single("planned", animeRef(1)),
      "Added Anime 1 to plan-to-watch",
    );
    assert.equal(
      describeActivity({
        id: "x",
        actor: ACTOR_A,
        kind: "planned",
        createdAt: at(0),
        count: 4,
        refs: [],
      }),
      "Added 4 to plan-to-watch",
    );
  });

  it("describes a ranking with its rank", () => {
    assert.equal(single("ranked", seriesRef(2), 1), "Ranked Series 2 #1");
  });

  it("describes imports as a count of titles", () => {
    assert.equal(single("imported", animeRef(1)), "Imported Anime 1");
    assert.equal(
      describeActivity({
        id: "x",
        actor: ACTOR_A,
        kind: "imported",
        createdAt: at(0),
        count: 187,
        refs: [],
      }),
      "Imported 187 titles",
    );
  });
});
