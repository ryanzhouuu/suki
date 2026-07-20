/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
const SUPABASE_COMMAND = process.platform === "win32" ? "npx.cmd" : "npx";
const LOCAL_SUPABASE_API_PORT = 54321;
const LOCAL_SUPABASE_DB_PORT = 54322;

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

function sanitizedCommandFailure(output) {
  return String(output ?? "")
    .split(/\r?\n/)
    .filter(
      (line) => !/(KEY|SECRET|SERVICE_ROLE|ANON|PUBLISHABLE|postgres(?:ql)?:\/\/)/i.test(line),
    )
    .join("\n")
    .trim();
}

function runSupabase(args, options = {}) {
  return run(SUPABASE_COMMAND, ["--no-install", "supabase", ...args], options);
}

function parseSupabaseStatusEnv(output) {
  const values = {};
  for (const line of String(output ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    values[match[1]] = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return values;
}

function firstValue(values, names, label) {
  for (const name of names) if (values[name]) return values[name];
  throw new Error(`Supabase status output is missing ${label}.`);
}

function normalizeSupabaseStatus(output) {
  const values = parseSupabaseStatusEnv(output);
  return {
    NEXT_PUBLIC_SUPABASE_URL: firstValue(
      values,
      ["API_URL", "SUPABASE_URL"],
      "the local API URL",
    ),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: firstValue(
      values,
      ["PUBLISHABLE_KEY", "ANON_KEY", "SUPABASE_PUBLISHABLE_KEY"],
      "the publishable key",
    ),
    SUPABASE_SECRET_KEY: firstValue(
      values,
      ["SECRET_KEY", "SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
      "the secret key",
    ),
    DATABASE_URL: firstValue(
      values,
      ["DB_URL", "DATABASE_URL"],
      "the database URL",
    ),
  };
}

function buildLocalApplicationEnvironment(statusOutput, overrides = {}) {
  return {
    ...normalizeSupabaseStatus(statusOutput),
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
    E2E_TEST_MODE: "1",
    ANILIST_GRAPHQL_URL: "http://127.0.0.1:4100/anilist/graphql",
    OPENAI_BASE_URL: "http://127.0.0.1:4100/openai/v1",
    OPENAI_API_KEY: "e2e-placeholder",
    ...overrides,
  };
}

function loopbackHost(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function portFor(url, defaultPort) {
  return url.port ? Number(url.port) : defaultPort;
}

function requiredUrl(value, name) {
  if (!value) throw new Error(`Missing ${name}; refusing E2E mutation.`);
  try {
    return new URL(value);
  } catch {
    throw new Error(`Invalid ${name}; refusing E2E mutation.`);
  }
}

function assertSafeLocalEnvironment(environment) {
  if (environment.E2E_TEST_MODE !== "1") {
    throw new Error("E2E_TEST_MODE must be 1 for local E2E mutations.");
  }

  const apiUrl = requiredUrl(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  if (
    apiUrl.protocol !== "http:" ||
    !loopbackHost(apiUrl.hostname) ||
    portFor(apiUrl, 80) !== LOCAL_SUPABASE_API_PORT
  ) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be http://127.0.0.1:${LOCAL_SUPABASE_API_PORT} or localhost equivalent.`,
    );
  }

  const databaseUrl = requiredUrl(environment.DATABASE_URL, "DATABASE_URL");
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !loopbackHost(databaseUrl.hostname) ||
    portFor(databaseUrl, 5432) !== LOCAL_SUPABASE_DB_PORT
  ) {
    throw new Error(
      `DATABASE_URL must target a loopback Postgres server on port ${LOCAL_SUPABASE_DB_PORT}.`,
    );
  }
}

function checkNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 20 || (major === 20 && minor < 9)) {
    throw new Error(`Node.js 20.9 or newer is required; found ${process.version}.`);
  }
}

function checkDocker() {
  const result = run("docker", ["info"]);
  if (result.status !== 0) {
    const detail = sanitizedCommandFailure(`${result.stdout}\n${result.stderr}`);
    throw new Error(
      `Docker is not reachable. Start Docker Desktop, then rerun the local test command.${detail ? `\n${detail}` : ""}`,
    );
  }
}

function readLocalSupabaseEnvironment() {
  const result = runSupabase(["status", "-o", "env"]);
  if (result.status !== 0) {
    throw new Error("Unable to read local Supabase status.");
  }
  return normalizeSupabaseStatus(result.stdout);
}

function startLocalSupabase() {
  const result = runSupabase(["start", "--exclude", "logflare"]);
  if (result.status === 0) return;

  const status = runSupabase(["status"]);
  if (status.status !== 0) {
    const detail = sanitizedCommandFailure(`${result.stdout}\n${result.stderr}`);
    throw new Error(`Supabase could not start.${detail ? `\n${detail}` : ""}`);
  }
}

function resetLocalSupabase() {
  const reset = runSupabase(["db", "reset", "--yes"]);
  if (reset.status === 0) return;

  const stop = runSupabase(["stop", "--no-backup"]);
  if (stop.status !== 0) {
    throw new Error("Local Supabase stack could not be stopped for reset recovery.");
  }

  startLocalSupabase();
  const retry = runSupabase(["db", "reset", "--yes"]);
  if (retry.status !== 0) {
    const detail = sanitizedCommandFailure(`${retry.stdout}\n${retry.stderr}`);
    throw new Error(`Local Supabase database reset failed after recovery.${detail ? `\n${detail}` : ""}`);
  }
}

module.exports = {
  ROOT,
  SUPABASE_COMMAND,
  LOCAL_SUPABASE_API_PORT,
  LOCAL_SUPABASE_DB_PORT,
  run,
  sanitizedCommandFailure,
  runSupabase,
  parseSupabaseStatusEnv,
  normalizeSupabaseStatus,
  buildLocalApplicationEnvironment,
  assertSafeLocalEnvironment,
  checkNodeVersion,
  checkDocker,
  readLocalSupabaseEnvironment,
  startLocalSupabase,
  resetLocalSupabase,
};
