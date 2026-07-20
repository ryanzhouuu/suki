import {
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

function fail(message) {
  console.error(`E2E: ${message}`);
  process.exit(1);
}

try {
  checkNodeVersion();
  checkDocker();
  console.log("E2E: starting local Supabase (or reusing the existing stack)…");
  startLocalSupabase();

  const status = readLocalSupabaseEnvironment();
  const resetEnvironment = { ...process.env, ...status, E2E_TEST_MODE: "1" };
  assertSafeLocalEnvironment(resetEnvironment);

  console.log("E2E: resetting the local database and replaying migrations…");
  resetLocalSupabase();

  const applicationStatus = readLocalSupabaseEnvironment();
  const applicationEnvironment = {
    ...process.env,
    ...buildLocalApplicationEnvironment(
      [
        `API_URL=${applicationStatus.NEXT_PUBLIC_SUPABASE_URL}`,
        `PUBLISHABLE_KEY=${applicationStatus.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
        `SECRET_KEY=${applicationStatus.SUPABASE_SECRET_KEY}`,
        `DATABASE_URL=${applicationStatus.DATABASE_URL}`,
      ].join("\n"),
    ),
  };
  assertSafeLocalEnvironment(applicationEnvironment);

  console.log("E2E: building the production Next.js server…");
  const build = run("npm", ["run", "build"], {
    env: applicationEnvironment,
    stdio: "inherit",
  });
  if (build.status !== 0) process.exit(build.status);

  console.log("E2E: running Playwright…");
  const playwright = run(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["--no-install", "playwright", "test", ...process.argv.slice(2)],
    { env: applicationEnvironment, stdio: "inherit" },
  );
  process.exit(playwright.status);
} catch (error) {
  const message = error instanceof Error ? error.message : "Local E2E setup failed.";
  const detail = sanitizedCommandFailure(message);
  fail(detail || "Local E2E setup failed.");
}
