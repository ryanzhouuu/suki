import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ActionRedirectError,
  createActionRuntime,
  isActionRedirect,
} from "./action-runtime";

describe("action runtime", () => {
  it("captures callbacks without running them until flushed", async () => {
    const runtime = createActionRuntime();
    const calls: string[] = [];

    runtime.after(async () => {
      calls.push("first");
      runtime.after(() => calls.push("nested"));
    });
    runtime.after(() => calls.push("second"));

    assert.deepEqual(calls, []);
    assert.equal(runtime.scheduledAfterCallbacks.length, 2);
    await runtime.flushAfterCallbacks();
    assert.deepEqual(calls, ["first", "second", "nested"]);
  });

  it("awaits explicitly tracked asynchronous work", async () => {
    const runtime = createActionRuntime();
    let complete = false;

    runtime.after(() => {
      runtime.trackPendingWork(
        Promise.resolve().then(() => {
          complete = true;
        }),
      );
    });

    await runtime.flushAfterCallbacks();
    assert.equal(complete, true);
  });

  it("uses a sentinel redirect error with a stable destination", () => {
    const runtime = createActionRuntime();
    assert.throws(
      () => runtime.redirect("/auth/login"),
      (error: unknown) => {
        assert.equal(isActionRedirect(error), true);
        assert.equal((error as ActionRedirectError).destination, "/auth/login");
        return true;
      },
    );
    assert.deepEqual(runtime.redirectDestinations, ["/auth/login"]);
  });
});
