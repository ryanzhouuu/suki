import { FIXTURE_PASSWORD, FIXTURE_USERS } from "./support/fixture-users";
import { authStatePath, expect, test } from "./support/test";

test.describe("authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects an unauthenticated browser from /home to login", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("shows an alert for invalid credentials and stays on login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("missing@example.test");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test("logs a valid fixture user in through the visible form", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(FIXTURE_USERS.library.email);
    await page.getByLabel("Password").fill(FIXTURE_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/home$/);
  });
});

test.describe("sign out", () => {
  test.use({ storageState: authStatePath("library") });

  test("clears access to authenticated routes", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);

    await page.goto("/home");
    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});
