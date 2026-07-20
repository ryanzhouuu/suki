import { authStatePath, expect, test } from "./support/test";
import { resetScenario } from "../support/local-supabase/scenario-builder";

test.describe("library persistence", () => {
  test.use({ storageState: authStatePath("library") });

  test.beforeEach(async () => {
    await resetScenario("library");
  });

  test("edits an existing entry and persists every value after reload", async ({ page }) => {
    await page.goto("/library");
    const card = page
      .getByRole("listitem")
      .filter({ hasText: "Moonlit Couriers" })
      .first();
    await expect(card).toContainText("Watching");
    await card.getByRole("button", { name: "Edit" }).click();

    const dialog = page.getByRole("dialog", { name: "Moonlit Couriers" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Status").selectOption("paused");
    await dialog.getByLabel(/Episode progress/).fill("7");
    await dialog.getByLabel(/Personal score/).fill("9.2");
    await dialog.getByLabel("Notes").fill("Updated during the browser journey.");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText("Updated.")).toBeVisible();

    await page.reload();
    const reloadedCard = page
      .getByRole("listitem")
      .filter({ hasText: "Moonlit Couriers" })
      .first();
    await expect(reloadedCard).toContainText("Paused");
    await reloadedCard.getByRole("button", { name: "Edit" }).click();

    const reloadedDialog = page.getByRole("dialog", { name: "Moonlit Couriers" });
    await expect(reloadedDialog.getByLabel("Status")).toHaveValue("paused");
    await expect(reloadedDialog.getByLabel(/Episode progress/)).toHaveValue("7");
    await expect(reloadedDialog.getByLabel(/Personal score/)).toHaveValue("9.2");
    await expect(reloadedDialog.getByLabel("Notes")).toHaveValue(
      "Updated during the browser journey.",
    );
  });
});
