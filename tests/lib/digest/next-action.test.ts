import assert from "node:assert/strict";
import test from "node:test";

import { selectNextAction } from "@/lib/digest/next-action";

test("selects the first available action in deterministic priority", () => {
  const selected = selectNextAction({
    personal_recommendation: {
      kind: "personal_recommendation",
      href: "/anime/2",
      title: "Pick",
      description: "Try this.",
    },
    continue: {
      kind: "continue",
      href: "/anime/1",
      title: "Continue",
      description: "Keep watching.",
    },
  });
  assert.equal(selected.kind, "continue");
});

test("falls back to seasonal browse", () => {
  assert.equal(selectNextAction({}).kind, "seasonal_browse");
});
