import assert from "node:assert/strict";
import { before, describe, it, mock } from "node:test";

const eventCalls: Array<{
  userId: string;
  eventType: string;
  metadata?: unknown;
}> = [];
let currentUserId = "00000000-0000-4000-8000-000000000001";
let logError: Error | null = null;

mock.module("@/lib/auth/session", {
  namedExports: {
    requireAuthUser: async () => ({ id: currentUserId }),
  },
});

mock.module("@/lib/events/log", {
  namedExports: {
    logUserEvent: async (
      userId: string,
      eventType: string,
      options?: { metadata?: unknown },
    ) => {
      if (logError) throw logError;
      eventCalls.push({ userId, eventType, metadata: options?.metadata });
    },
  },
});

let logTasteFingerprintEvent: typeof import("@/actions/fingerprint").logTasteFingerprintEvent;

before(async () => {
  ({ logTasteFingerprintEvent } = await import("@/actions/fingerprint"));
});

const targetProfileUserId = "00000000-0000-4000-8000-000000000002";
const fingerprintVersion = "fingerprint_v1";

function validInput(
  overrides: Partial<Parameters<typeof logTasteFingerprintEvent>[0]> = {},
) {
  return {
    eventKind: "viewed",
    fingerprintVersion,
    targetProfileUserId,
    ...overrides,
  };
}

describe("logTasteFingerprintEvent", () => {
  it("authenticates and logs a sanitized own-profile impression", async () => {
    currentUserId = targetProfileUserId;
    await logTasteFingerprintEvent(validInput());

    assert.deepEqual(eventCalls.at(-1), {
      userId: targetProfileUserId,
      eventType: "taste_fingerprint_viewed",
      metadata: {
        fingerprintVersion,
        isOwnProfile: true,
      },
    });
  });

  it("logs a valid trait expansion without target identity or evidence", async () => {
    currentUserId = "00000000-0000-4000-8000-000000000003";
    await logTasteFingerprintEvent(
      validInput({
        eventKind: "evidence_opened",
        traitId: "battle-tested-favorites",
      }),
    );

    const call = eventCalls.at(-1);
    assert.equal(call?.eventType, "taste_fingerprint_evidence_opened");
    assert.deepEqual(call?.metadata, {
      fingerprintVersion,
      traitId: "battle-tested-favorites",
      isOwnProfile: false,
    });
    assert.equal(JSON.stringify(call?.metadata).includes(targetProfileUserId), false);
  });

  it("rejects invalid event kinds, versions, UUIDs, and trait IDs", async () => {
    const cases = [
      validInput({ eventKind: "unknown" }),
      validInput({ fingerprintVersion: "fingerprint_v2" }),
      validInput({ targetProfileUserId: "not-a-uuid" }),
      validInput({ traitId: "not-a-fingerprint-trait" }),
      validInput({ traitId: "battle-tested-favorites" }),
      validInput({ eventKind: "evidence_opened" }),
    ];

    for (const input of cases) {
      await assert.rejects(() => logTasteFingerprintEvent(input));
    }
  });

  it("swallows logging failures", async () => {
    logError = new Error("analytics unavailable");
    await assert.doesNotReject(() =>
      logTasteFingerprintEvent(validInput({ traitId: null })),
    );
    logError = null;
  });
});
