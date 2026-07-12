import "server-only";

import { randomUUID } from "node:crypto";

import { unstable_rethrow } from "next/navigation";

import {
  classifyResilienceError,
  safeMessageFor,
  type OperationContext,
  type ResilientResult,
} from "./errors";
import {
  reportResilienceFailure,
  type ResilienceReportSink,
} from "./report";

type OperationOptions = {
  reportSink?: ResilienceReportSink;
  createCorrelationId?: () => string;
  now?: () => number;
};

export async function runResilientOperation<T>(
  context: OperationContext,
  operation: () => T | Promise<T>,
  options: OperationOptions = {},
): Promise<ResilientResult<T>> {
  const now = options.now ?? Date.now;
  const startedAt = now();

  try {
    return { status: "loaded", data: await operation() };
  } catch (error) {
    unstable_rethrow(error);
    const classified = classifyResilienceError(context.dependency, error);
    if (!classified) throw error;

    const correlationId = (options.createCorrelationId ?? randomUUID)();
    reportResilienceFailure(
      context,
      classified,
      correlationId,
      now() - startedAt,
      options.reportSink,
    );

    return {
      status: "unavailable",
      failure: {
        dependency: context.dependency,
        kind: classified.kind,
        retryable: classified.retryable,
        correlationId,
        safeMessage: safeMessageFor(classified.kind),
      },
    };
  }
}
