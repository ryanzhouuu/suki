import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";

import { cleanup, render, waitFor } from "@testing-library/react";

const eventCalls: Array<Record<string, unknown>> = [];
let actionError: Error | null = null;

mock.module("@/actions/fingerprint", {
  namedExports: {
    logTasteFingerprintEvent: async (input: Record<string, unknown>) => {
      if (actionError) throw actionError;
      eventCalls.push(input);
    },
  },
});

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = [];
  readonly callback: ObserverCallback;

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    TestIntersectionObserver.instances.push(this);
  }

  observe() {}

  disconnect() {}

  enter() {
    this.callback([{ isIntersecting: true }]);
  }
}

const originalIntersectionObserver = globalThis.IntersectionObserver;
let TasteFingerprintTracker: typeof import("@/components/profile/taste-fingerprint-tracker").TasteFingerprintTracker;

before(async () => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: TestIntersectionObserver,
  });
  ({ TasteFingerprintTracker } = await import(
    "@/components/profile/taste-fingerprint-tracker"
  ));
});

afterEach(() => {
  cleanup();
  eventCalls.length = 0;
  actionError = null;
  TestIntersectionObserver.instances.length = 0;
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: originalIntersectionObserver,
  });
});

function renderTracker(isSignedIn = true) {
  return render(
    <section data-taste-fingerprint-section>
      <details data-fingerprint-trait-id="battle-tested-favorites">
        <summary>Battle-Tested Favorites</summary>
      </details>
      <details data-fingerprint-trait-id="movie-night-regular">
        <summary>Movie Night Regular</summary>
      </details>
      <details data-fingerprint-trait-id="not-a-known-trait">
        <summary>Unknown trait</summary>
      </details>
      <TasteFingerprintTracker
        isSignedIn={isSignedIn}
        targetProfileUserId="00000000-0000-4000-8000-000000000002"
        fingerprintVersion="fingerprint_v1"
        traitIds={["battle-tested-favorites", "movie-night-regular"]}
      />
    </section>,
  );
}

describe("TasteFingerprintTracker", () => {
  it("logs one signed-in impression only after the parent enters the viewport", async () => {
    renderTracker();
    assert.deepEqual(eventCalls, []);

    TestIntersectionObserver.instances[0].enter();
    TestIntersectionObserver.instances[0].enter();

    await waitFor(() => assert.equal(eventCalls.length, 1));
    assert.deepEqual(eventCalls[0], {
      eventKind: "viewed",
      fingerprintVersion: "fingerprint_v1",
      targetProfileUserId: "00000000-0000-4000-8000-000000000002",
      traitId: undefined,
    });
  });

  it("logs the first native details expansion per trait and ignores repeats", async () => {
    const { container } = renderTracker();
    const details = container.querySelectorAll("details");

    details[0].open = true;
    details[0].dispatchEvent(new Event("toggle"));
    details[0].open = false;
    details[0].dispatchEvent(new Event("toggle"));
    details[0].open = true;
    details[0].dispatchEvent(new Event("toggle"));
    details[1].open = true;
    details[1].dispatchEvent(new Event("toggle"));

    await waitFor(() => assert.equal(eventCalls.length, 2));
    assert.deepEqual(
      eventCalls.map((call) => call.traitId),
      ["battle-tested-favorites", "movie-night-regular"],
    );
    assert.equal(eventCalls[0].eventKind, "evidence_opened");
    assert.equal(eventCalls[1].eventKind, "evidence_opened");
  });

  it("does not install or send analytics for anonymous viewers", () => {
    renderTracker(false);
    assert.equal(TestIntersectionObserver.instances.length, 0);
    assert.deepEqual(eventCalls, []);
  });

  it("suppresses unknown trait IDs and swallows rejected analytics actions", async () => {
    const { container } = renderTracker();
    const details = container.querySelectorAll("details");

    details[2].open = true;
    details[2].dispatchEvent(new Event("toggle"));
    assert.deepEqual(eventCalls, []);

    actionError = new Error("analytics rejected");
    details[0].open = true;
    details[0].dispatchEvent(new Event("toggle"));

    await waitFor(() => assert.equal(details[0].open, true));
    assert.deepEqual(eventCalls, []);
  });
});
