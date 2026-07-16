import { FIXTURE_USERS } from "./support/fixture-users";
import { authStatePath, expect, test } from "./support/test";
import { resetScenario } from "./support/scenario-builder";

test.describe("onboarding", () => {
  test.use({ storageState: authStatePath("onboarding") });

  test.beforeEach(async () => {
    await resetScenario("onboarding");
  });

  test("redirects a profile-less authenticated user to onboarding", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(
      page.getByRole("heading", { name: /Welcome to Suki/ }),
    ).toBeVisible();
  });

  test("creates a profile and remains past onboarding after reload", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByLabel("Username").fill(FIXTURE_USERS.onboarding.username);
    await page.getByLabel("Display name (optional)").fill("New Library Owner");
    await page.getByLabel("Bio (optional)").fill("A profile created in the browser.");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/setup\/library$/);
    await expect(page.getByRole("heading", { name: "Build your library" })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/setup\/library$/);
    await expect(page.getByRole("heading", { name: "Build your library" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Welcome to Suki/ })).toHaveCount(0);
  });
});
