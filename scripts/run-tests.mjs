import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function collectTestFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectTestFiles(path));
      continue;
    }
    if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) files.push(path);
  }
  return files;
}

const testFiles = collectTestFiles("tests").sort();

if (testFiles.length === 0) {
  console.error("No test files found under tests/");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "tsx",
    "--experimental-test-module-mocks",
    "--import",
    "./tests/setup/dom.mjs",
    "--test",
    ...testFiles,
  ],
  { stdio: "inherit", shell: true },
);

process.exit(result.status ?? 1);
