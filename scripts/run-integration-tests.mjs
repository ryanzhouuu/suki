import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  ROOT,
  assertSafeLocalEnvironment,
  buildLocalApplicationEnvironment,
  checkDocker,
  checkNodeVersion,
  readLocalSupabaseEnvironment,
  resetLocalSupabase,
  run,
  sanitizedCommandFailure,
  startLocalSupabase,
} from "./lib/local-supabase.cjs";

function collectIntegrationFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectIntegrationFiles(path));
    } else if (entry.endsWith(".integration.ts")) {
      files.push(path);
    }
  }
  return files;
}

function fail(message) {
  console.error(`Integration: ${message}`);
  process.exit(1);
}

const testFiles = collectIntegrationFiles(join(ROOT, "tests/integration")).sort();
if (testFiles.length === 0) fail("No integration files found under tests/integration/.");

try {
  checkNodeVersion();
  checkDocker();
  console.log("Integration: starting local Supabase (or reusing the existing stack)…");
  startLocalSupabase();

  const status = readLocalSupabaseEnvironment();
  assertSafeLocalEnvironment({ ...process.env, ...status, E2E_TEST_MODE: "1" });
  console.log("Integration: resetting the local database and replaying migrations…");
  resetLocalSupabase();

  const applicationStatus = readLocalSupabaseEnvironment();
  const testEnvironment = {
    ...process.env,
    ...buildLocalApplicationEnvironment(
      [
        `API_URL=${applicationStatus.NEXT_PUBLIC_SUPABASE_URL}`,
        `PUBLISHABLE_KEY=${applicationStatus.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
        `SECRET_KEY=${applicationStatus.SUPABASE_SECRET_KEY}`,
        `DATABASE_URL=${applicationStatus.DATABASE_URL}`,
      ].join("\n"),
      { SERIES_ADMIN_EMAILS: "action-admin@example.test" },
    ),
  };
  assertSafeLocalEnvironment(testEnvironment);

  const result = run(
    process.execPath,
    [
      "--import",
      "tsx",
      "--experimental-test-module-mocks",
      "--import",
      "./tests/setup/server-only-stub.mjs",
      "--test-concurrency=1",
      "--test",
      ...testFiles,
    ],
    { env: testEnvironment, stdio: "inherit" },
  );
  process.exit(result.status);
} catch (error) {
  const message = error instanceof Error ? error.message : "Local integration setup failed.";
  fail(sanitizedCommandFailure(message) || "Local integration setup failed.");
}
