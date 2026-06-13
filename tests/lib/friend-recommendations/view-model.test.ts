import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildReceivedRecommendations,
  canRespondToRecommendation,
  describeRecipientLibraryStatus,
  FRIEND_REC_NOTE_MAX,
  statusForResponse,
  validateRecommendationNote,
  type RecommendedAnimeRef,
  type ReceivedRecommendationRow,
  type SenderRef,
} from "@/lib/friend-recommendations/view-model";

const sender: SenderRef = {
  user_id: "u-sender",
  username: "ryan",
  display_name: "Ryan",
  avatar_url: null,
};

function anime(id: string): RecommendedAnimeRef {
  return {
    id,
    anilist_id: 100,
    romaji_title: "Title",
    english_title: null,
    cover_image_url: null,
    format: "TV",
    episodes: 12,
  };
}

describe("validateRecommendationNote", () => {
  it("treats null/blank as no note", () => {
    assert.deepEqual(validateRecommendationNote(null), { ok: true, note: null });
    assert.deepEqual(validateRecommendationNote("   "), { ok: true, note: null });
  });

  it("trims a valid note", () => {
    assert.deepEqual(validateRecommendationNote("  watch this  "), {
      ok: true,
      note: "watch this",
    });
  });

  it("rejects an over-long note", () => {
    const result = validateRecommendationNote("x".repeat(FRIEND_REC_NOTE_MAX + 1));
    assert.equal(result.ok, false);
  });

  it("accepts a note exactly at the cap", () => {
    const result = validateRecommendationNote("x".repeat(FRIEND_REC_NOTE_MAX));
    assert.deepEqual(result, { ok: true, note: "x".repeat(FRIEND_REC_NOTE_MAX) });
  });
});

describe("response status rules", () => {
  it("only allows responding to pending recs", () => {
    assert.equal(canRespondToRecommendation("pending"), true);
    assert.equal(canRespondToRecommendation("added"), false);
    assert.equal(canRespondToRecommendation("dismissed"), false);
  });

  it("maps responses to terminal statuses", () => {
    assert.equal(statusForResponse("add"), "added");
    assert.equal(statusForResponse("dismiss"), "dismissed");
  });
});

describe("describeRecipientLibraryStatus", () => {
  it("returns a hint for tracked statuses and null otherwise", () => {
    assert.match(describeRecipientLibraryStatus("completed") ?? "", /completed/i);
    assert.match(describeRecipientLibraryStatus("plan_to_watch") ?? "", /plan/i);
    assert.equal(describeRecipientLibraryStatus(null), null);
  });
});

describe("buildReceivedRecommendations", () => {
  const senders = new Map([[sender.user_id, sender]]);

  it("assembles rows and flags already-in-library titles", () => {
    const rows: ReceivedRecommendationRow[] = [
      {
        id: "r1",
        note: "loved it",
        created_at: "2026-06-13T00:00:00Z",
        sender_id: sender.user_id,
        anime: anime("a1"),
      },
      {
        id: "r2",
        note: null,
        created_at: "2026-06-12T00:00:00Z",
        sender_id: sender.user_id,
        anime: anime("a2"),
      },
    ];

    const result = buildReceivedRecommendations(rows, senders, new Set(["a2"]));
    assert.equal(result.length, 2);
    assert.equal(result[0].alreadyInLibrary, false);
    assert.equal(result[1].alreadyInLibrary, true);
    assert.equal(result[0].sender.username, "ryan");
  });

  it("drops rows missing their anime or sender", () => {
    const rows: ReceivedRecommendationRow[] = [
      {
        id: "r1",
        note: null,
        created_at: "2026-06-13T00:00:00Z",
        sender_id: sender.user_id,
        anime: null,
      },
      {
        id: "r2",
        note: null,
        created_at: "2026-06-13T00:00:00Z",
        sender_id: "unknown",
        anime: anime("a1"),
      },
    ];

    assert.deepEqual(buildReceivedRecommendations(rows, senders, new Set()), []);
  });
});
