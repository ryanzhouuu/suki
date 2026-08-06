import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function collectTestFiles(target) {
  if (!statSync(target).isDirectory()) return [target];
  const files = [];
  for (const entry of readdirSync(target)) {
    const path = join(target, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectTestFiles(path));
      continue;
    }
    if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) files.push(path);
  }
  return files;
}

const roots = process.argv.slice(2);
const testFiles = (roots.length > 0 ? roots : ["tests"])
  .flatMap(collectTestFiles)
  .filter((path) => path.endsWith(".test.ts") || path.endsWith(".test.tsx"))
  .sort();

if (testFiles.length === 0) {
  console.error("No test files found under tests/");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "--experimental-test-module-mocks",
    "--import",
    "./tests/setup/server-only-stub.mjs",
    "--import",
    "./tests/setup/dom.mjs",
    "--test",
    ...testFiles,
  ],
  { stdio: "inherit", shell: true },
);

process.exit(result.status ?? 1);
