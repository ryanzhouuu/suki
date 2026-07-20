import path from "node:path";

import { expect, test as base } from "@playwright/test";

import type { FixtureUserName } from "../../support/local-supabase/fixture-users";

export const test = base;
export { expect };

export function authStatePath(name: FixtureUserName): string {
  return path.resolve("playwright/.auth", `${name}.json`);
}
