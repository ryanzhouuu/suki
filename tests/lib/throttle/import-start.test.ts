import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import {
  checkImportStartThrottle,
  IMPORT_START_COOLDOWN_MS,
  IMPORT_START_DAILY_LIMIT,
} from "@/lib/throttle/import-start";

type Row = { created_at: string };
type QueryResult = { data: Row[] | null; error: { message: string } | null };

/** Chainable stub matching `.from().select().eq().gte()`, recording the calls made. */
function createStubSupabase(result: QueryResult) {
  const calls: { table?: string; select?: string; eq?: [string, unknown]; gte?: [string, unknown] } =
    {};
  const client = {
    from(table: string) {
      calls.table = table;
      return {
        select(columns: string) {
          calls.select = columns;
          return {
            eq(column: string, value: unknown) {
              calls.eq = [column, value];
              return {
                gte(column: string, value: unknown) {
                  calls.gte = [column, value];
                  return Promise.resolve(result);
                },
              };
            },
          };
        },
      };
    },
  };
  return { client, calls };
}

describe("checkImportStartThrottle", () => {
  it("allows when there are no recent import jobs", async () => {
    const { client, calls } = createStubSupabase({ data: [], error: null });
    const decision = await checkImportStartThrottle(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      "user-1",
    );
    assert.deepEqual(decision, { allowed: true });
    assert.equal(calls.table, "anime_import_jobs");
    assert.equal(calls.select, "created_at");
    assert.deepEqual(calls.eq, ["user_id", "user-1"]);
    assert.equal(calls.gte?.[0], "created_at");
  });

  it("blocks inside the cooldown window", async () => {
    const now = Date.now();
    const recent = new Date(now - 5_000).toISOString(); // 5s ago, well inside 2min cooldown
    const { client } = createStubSupabase({ data: [{ created_at: recent }], error: null });
    const decision = await checkImportStartThrottle(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      "user-1",
    );
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.ok(decision.retryAfterSeconds > 0);
      assert.ok(decision.retryAfterSeconds <= IMPORT_START_COOLDOWN_MS / 1000);
    }
  });

  it("blocks once the daily limit is reached", async () => {
    const now = Date.now();
    // 10 jobs spaced 10 minutes apart (older than cooldown, but within the daily cap).
    const rows: Row[] = Array.from({ length: IMPORT_START_DAILY_LIMIT }, (_, i) => ({
      created_at: new Date(now - (i + 1) * 10 * 60_000).toISOString(),
    }));
    const { client } = createStubSupabase({ data: rows, error: null });
    const decision = await checkImportStartThrottle(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      "user-1",
    );
    assert.equal(decision.allowed, false);
  });

  it("allows when jobs are outside both the cooldown and the daily limit", async () => {
    const now = Date.now();
    const rows: Row[] = [
      { created_at: new Date(now - 10 * 60_000).toISOString() }, // 10 min ago, past 2min cooldown
    ];
    const { client } = createStubSupabase({ data: rows, error: null });
    const decision = await checkImportStartThrottle(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      "user-1",
    );
    assert.deepEqual(decision, { allowed: true });
  });

  it("fails open when Supabase returns an error", async () => {
    const { client } = createStubSupabase({
      data: null,
      error: { message: "connection reset" },
    });
    const decision = await checkImportStartThrottle(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      "user-1",
    );
    assert.deepEqual(decision, { allowed: true });
  });
});
