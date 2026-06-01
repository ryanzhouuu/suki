import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Tables } from "@/types/database";

import { mergeFriendshipRows } from "./queries";

function friendship(
  overrides: Partial<Tables<"friendships">> & Pick<Tables<"friendships">, "id">,
): Tables<"friendships"> {
  return {
    requester_id: "viewer",
    recipient_id: "other",
    status: "pending",
    created_at: "",
    responded_at: null,
    ...overrides,
  };
}

describe("mergeFriendshipRows", () => {
  it("indexes friendships by the other user id", () => {
    const map = mergeFriendshipRows(
      "viewer",
      [friendship({ id: "1", recipient_id: "alice" })],
      [friendship({ id: "2", requester_id: "bob", recipient_id: "viewer" })],
    );

    assert.equal(map.get("alice")?.id, "1");
    assert.equal(map.get("bob")?.id, "2");
    assert.equal(map.size, 2);
  });

  it("later row wins when duplicate other ids", () => {
    const map = mergeFriendshipRows(
      "viewer",
      [friendship({ id: "first", recipient_id: "alice" })],
      [friendship({ id: "second", requester_id: "alice", recipient_id: "viewer" })],
    );
    assert.equal(map.get("alice")?.id, "second");
  });
});
