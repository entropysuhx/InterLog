import { expect, test } from "@playwright/test";

test("mobile navigation drawer reaches every product page", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, "Mobile navigation is hidden on desktop.");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.getByRole("link", { name: "Calendar" }).click();
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
});
