import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";

import {
  createActionRuntime,
  installActionRuntimeMocks,
  type ActionRuntime,
} from "../helpers/action-runtime";

const user = { id: "00000000-0000-4000-8000-000000000001" } as never;
const entryId = "00000000-0000-4000-8000-000000000002";

function createClient(options?: { rpcResult?: boolean; error?: string }) {
  const profileUpdates: Record<string, unknown>[] = [];
  const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  return {
    profileUpdates,
    rpcCalls,
    from() {
      return {
        update(values: Record<string, unknown>) {
          profileUpdates.push(values);
          return {
            eq: async () => ({
              error: options?.error ? { message: options.error } : null,
            }),
          };
        },
      };
    },
    async rpc(name: string, args: Record<string, unknown>) {
      rpcCalls.push({ name, args });
      return {
        data: options?.rpcResult ?? true,
        error: options?.error ? { message: options.error } : null,
      };
    },
  };
}

let runtime: ActionRuntime;
let updateInactivitySettings: typeof import("@/actions/inactivity").updateInactivitySettings;
let resolveInactivityPrompt: typeof import("@/actions/inactivity").resolveInactivityPrompt;

before(async () => {
  runtime = createActionRuntime();
  installActionRuntimeMocks(runtime);
  ({ updateInactivitySettings, resolveInactivityPrompt } = await import(
    "@/actions/inactivity"
  ));
});

beforeEach(() => {
  runtime.resetCaptures();
});

describe("inactivity actions", () => {
  it("validates and saves both user thresholds", async () => {
    const client = createClient();
    runtime.setActor({ user, client });
    const form = new FormData();
    form.set("auto_pause_days", "21");
    form.set("drop_prompt_days", "45");

    const result = await updateInactivitySettings({}, form);

    assert.equal(result.message, "Library automation settings updated.");
    assert.deepEqual(client.profileUpdates, [
      { auto_pause_days: 21, drop_prompt_days: 45 },
    ]);
    assert.deepEqual(runtime.revalidatedPaths, ["/home", "/settings"]);
  });

  it("rejects invalid thresholds without writing", async () => {
    const client = createClient();
    runtime.setActor({ user, client });
    const form = new FormData();
    form.set("auto_pause_days", "3");
    form.set("drop_prompt_days", "30");

    const result = await updateInactivitySettings({}, form);

    assert.match(result.error ?? "", /7 to 365/);
    assert.equal(client.profileUpdates.length, 0);
  });

  it("resolves one owned due prompt through the constrained RPC", async () => {
    const client = createClient();
    runtime.setActor({ user, client });
    const form = new FormData();
    form.set("entry_id", entryId);
    form.set("decision", "keep_paused");

    const result = await resolveInactivityPrompt({}, form);

    assert.equal(result.resolvedEntryId, entryId);
    assert.deepEqual(client.rpcCalls, [
      {
        name: "resolve_anime_inactivity_prompt",
        args: { p_entry_id: entryId, p_should_drop: false },
      },
    ]);
    assert.deepEqual(runtime.revalidatedPaths, ["/home", "/library"]);
  });
});
