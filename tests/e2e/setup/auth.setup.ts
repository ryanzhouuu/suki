import { expect, test } from "@playwright/test";

import { FIXTURE_PASSWORD, FIXTURE_USERS } from "../support/fixture-users";
import { authStatePath } from "../support/test";

test("authenticate local fixture users", async ({ page }) => {
  for (const [name, fixture] of Object.entries(FIXTURE_USERS) as Array<
    [keyof typeof FIXTURE_USERS, (typeof FIXTURE_USERS)[keyof typeof FIXTURE_USERS]]
  >) {
    await page.context().clearCookies();
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(fixture.email);
    await page.getByLabel("Password").fill(FIXTURE_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    if (name === "onboarding") {
      await expect(page).toHaveURL(/\/onboarding$/);
    } else {
      await expect(page).toHaveURL(/\/home$/);
    }

    await page.context().storageState({ path: authStatePath(name) });
  }
});
