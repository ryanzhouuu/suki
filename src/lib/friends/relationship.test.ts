import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Tables } from "@/types/database";

import {
  assertAcceptedFriends,
  friendshipStatusForViewer,
} from "./relationship";

const viewerId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";

function row(
  overrides: Partial<Tables<"friendships">> = {},
): Tables<"friendships"> {
  return {
    id: "00000000-0000-4000-8000-000000000099",
    requester_id: viewerId,
    recipient_id: otherId,
    status: "pending",
    created_at: new Date().toISOString(),
    responded_at: null,
    ...overrides,
  };
}

describe("friendshipStatusForViewer", () => {
  it("returns none when no row", () => {
    assert.equal(friendshipStatusForViewer(null, viewerId), "none");
  });

  it("detects outgoing pending", () => {
    assert.equal(
      friendshipStatusForViewer(row({ status: "pending" }), viewerId),
      "pending_outgoing",
    );
  });

  it("detects incoming pending", () => {
    assert.equal(
      friendshipStatusForViewer(
        row({ requester_id: otherId, recipient_id: viewerId }),
        viewerId,
      ),
      "pending_incoming",
    );
  });

  it("detects accepted friends", () => {
    assert.equal(
      friendshipStatusForViewer(row({ status: "accepted" }), viewerId),
      "friends",
    );
  });
});

describe("assertAcceptedFriends", () => {
  it("throws when not accepted", () => {
    assert.throws(() =>
      assertAcceptedFriends(row({ status: "pending" }), viewerId, otherId),
    );
  });

  it("passes for accepted friendship", () => {
    assert.doesNotThrow(() =>
      assertAcceptedFriends(row({ status: "accepted" }), viewerId, otherId),
    );
  });
});
