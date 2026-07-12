import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { notFound, redirect } from "next/navigation";

import { runResilientOperation } from "@/lib/resilience/operation";
import {
  createResilienceReport,
  type ResilienceReport,
} from "@/lib/resilience/report";

const context = {
  route: "/home",
  operation: "load_trending",
  dependency: "anilist" as const,
  userId: "private-user-id",
  resourceId: "private-resource-id",
};

describe("runResilientOperation", () => {
  it("returns successful values without reporting", async () => {
    const reports: ResilienceReport[] = [];
    const result = await runResilientOperation(context, async () => [1, 2], {
      reportSink: (report) => reports.push(report),
    });
    assert.deepEqual(result, { status: "loaded", data: [1, 2] });
    assert.deepEqual(reports, []);
  });

  it("returns one handled failure with a UUID and emits exactly one report", async () => {
    const reports: ResilienceReport[] = [];
    const result = await runResilientOperation(
      context,
      () => {
        throw new Error("AniList request failed: 503");
      },
      { reportSink: (report) => reports.push(report) },
    );

    assert.equal(result.status, "unavailable");
    if (result.status !== "unavailable") return;
    assert.match(
      result.failure.correlationId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    assert.equal(result.failure.dependency, "anilist");
    assert.equal(result.failure.retryable, true);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].correlation_id, result.failure.correlationId);
  });

  it("reports deterministic duration and correlation ID when injected", async () => {
    const reports: ResilienceReport[] = [];
    const times = [100, 142];
    const result = await runResilientOperation(
      { ...context, dependency: "openai" },
      () => Promise.reject({ status: 429, code: "rate_limit_exceeded" }),
      {
        reportSink: (report) => reports.push(report),
        createCorrelationId: () => "correlation-id",
        now: () => times.shift() ?? 142,
      },
    );
    assert.equal(result.status, "unavailable");
    assert.equal(reports[0].duration_ms, 42);
    assert.equal(reports[0].provider_status, 429);
    assert.equal(reports[0].provider_code, "rate_limit_exceeded");
  });

  it("rethrows unknown programming errors and does not report", async () => {
    const reports: ResilienceReport[] = [];
    const bug = new TypeError("cannot read property");
    await assert.rejects(
      runResilientOperation(context, () => {
        throw bug;
      }, { reportSink: (report) => reports.push(report) }),
      (error) => error === bug,
    );
    assert.deepEqual(reports, []);
  });

  it("preserves redirect and notFound framework control flow", async () => {
    await assert.rejects(
      runResilientOperation(context, () => redirect("/login"), {
        reportSink: () => assert.fail("redirect should not be reported"),
      }),
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        String(error.digest).startsWith("NEXT_REDIRECT"),
    );
    await assert.rejects(
      runResilientOperation(context, () => notFound(), {
        reportSink: () => assert.fail("notFound should not be reported"),
      }),
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        String(error.digest).startsWith("NEXT_HTTP_ERROR_FALLBACK;404"),
    );
  });
});

describe("createResilienceReport", () => {
  it("contains only allowlisted fields and never raw IDs or provider messages", () => {
    const report = createResilienceReport(
      context,
      {
        kind: "unavailable",
        retryable: true,
        providerStatus: 503,
        providerCode: "safe_code",
      },
      "correlation-id",
      12.6,
    );
    assert.deepEqual(report, {
      event: "dependency_operation_failed",
      level: "warn",
      correlation_id: "correlation-id",
      route: "/home",
      operation: "load_trending",
      dependency: "anilist",
      kind: "unavailable",
      retryable: true,
      duration_ms: 13,
      provider_status: 503,
      provider_code: "safe_code",
    });
    const serialized = JSON.stringify(report);
    assert.doesNotMatch(serialized, /private-user-id|private-resource-id|message|stack/);
  });

  it("drops invalid provider metadata", () => {
    const report = createResilienceReport(
      context,
      {
        kind: "configuration",
        retryable: false,
        providerStatus: 999,
        providerCode: "raw error: token=secret",
      },
      "correlation-id",
      -5,
    );
    assert.equal(report.provider_status, undefined);
    assert.equal(report.provider_code, undefined);
    assert.equal(report.duration_ms, 0);
    assert.equal(report.level, "error");
  });
});
