import { spawnSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname;
const SUPABASE_COMMAND = process.platform === "win32" ? "npx.cmd" : "npx";

function sanitized(output) {
  return String(output ?? "")
    .split(/\r?\n/)
    .filter((line) => !/(KEY|SECRET|SERVICE_ROLE|ANON|PUBLISHABLE|postgres(?:ql)?:\/\/)/i.test(line))
    .join("\n")
    .trim();
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    ...options,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function fail(message, result) {
  const detail = sanitized(`${result?.stdout ?? ""}\n${result?.stderr ?? ""}`);
  console.error(`E2E: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function runSupabase(args) {
  return run(SUPABASE_COMMAND, ["--no-install", "supabase", ...args]);
}

function parseEnvOutput(output) {
  const values = {};
  for (const line of output.split(/\r?\n/)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    values[match[1]] = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return values;
}

function first(values, names, label) {
  for (const name of names) if (values[name]) return values[name];
  throw new Error(`Supabase status output is missing ${label}.`);
}

function normalizeStatus(output) {
  const values = parseEnvOutput(output);
  return {
    NEXT_PUBLIC_SUPABASE_URL: first(values, ["API_URL", "SUPABASE_URL"], "the local API URL"),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: first(
      values,
      ["PUBLISHABLE_KEY", "ANON_KEY", "SUPABASE_PUBLISHABLE_KEY"],
      "the publishable key",
    ),
    SUPABASE_SECRET_KEY: first(
      values,
      ["SECRET_KEY", "SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
      "the secret key",
    ),
    DATABASE_URL: first(values, ["DB_URL", "DATABASE_URL"], "the database URL"),
  };
}

function checkNode() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 20 || (major === 20 && minor < 9)) {
    fail(`Node.js 20.9 or newer is required; found ${process.version}.`);
  }
}

function checkDocker() {
  const result = run("docker", ["info"]);
  if (result.status !== 0) {
    fail("Docker is not reachable. Start Docker Desktop, then rerun npm run test:e2e.", result);
  }
}

function readSupabaseStatus() {
  const result = runSupabase(["status", "-o", "env"]);
  if (result.status !== 0) fail("Unable to read local Supabase status.", result);
  return result.stdout;
}

function startSupabase() {
  console.log("E2E: starting local Supabase (or reusing the existing stack)…");
  const result = runSupabase(["start"]);
  if (result.status === 0) return;

  const status = runSupabase(["status"]);
  if (status.status !== 0) fail("Supabase could not start.", result);
  console.log("E2E: local Supabase stack is already running.");
}

const { assertLocalE2eEnvironment } = await import(
  "../tests/e2e/support/local-safety.ts"
);

checkNode();
checkDocker();
startSupabase();

const beforeReset = normalizeStatus(readSupabaseStatus());
const resetEnvironment = { ...process.env, ...beforeReset, E2E_TEST_MODE: "1" };
try {
  assertLocalE2eEnvironment(resetEnvironment);
} catch (error) {
  fail(error instanceof Error ? error.message : "Local safety validation failed.");
}

console.log("E2E: resetting the local database and replaying migrations…");
const reset = runSupabase(["db", "reset", "--yes"]);
if (reset.status !== 0) fail("Local Supabase database reset failed.", reset);

const applicationEnvironment = {
  ...process.env,
  ...normalizeStatus(readSupabaseStatus()),
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
  E2E_TEST_MODE: "1",
  ANILIST_GRAPHQL_URL: "http://127.0.0.1:4100/anilist/graphql",
  OPENAI_BASE_URL: "http://127.0.0.1:4100/openai/v1",
  OPENAI_API_KEY: "e2e-placeholder",
};

try {
  assertLocalE2eEnvironment(applicationEnvironment);
} catch (error) {
  fail(error instanceof Error ? error.message : "Local safety validation failed.");
}

console.log("E2E: building the production Next.js server…");
const build = run("npm", ["run", "build"], { env: applicationEnvironment, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status);

console.log("E2E: running Playwright…");
const playwrightArgs = ["--no-install", "playwright", "test", ...process.argv.slice(2)];
const playwright = run(SUPABASE_COMMAND, playwrightArgs, {
  env: applicationEnvironment,
  stdio: "inherit",
});
process.exit(playwright.status);
