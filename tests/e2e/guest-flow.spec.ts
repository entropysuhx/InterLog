import { expect, test, type Page } from "@playwright/test";

async function createLearningActivity(page: Page) {
  await page.goto("/dashboard");
  await page.getByLabel("Activity actions").getByRole("button", { name: "Add Activity", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add activity" });
  await dialog.getByLabel("Activity title").fill("Study TypeScript");
  await dialog.getByRole("button", { name: "Learning" }).click();
  await dialog.getByRole("button", { name: "Add activity", exact: true }).click();
  await expect(page.getByText("Study TypeScript").first()).toBeVisible();
}

test("guest can create, edit, and delete an activity", async ({ page }) => {
  await createLearningActivity(page);

  await page.getByRole("button", { name: "Edit Study TypeScript" }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit activity" });
  await editDialog.getByLabel("Activity title").fill("Review TypeScript");
  await editDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Review TypeScript").first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Edit Review TypeScript" }).click();
  await page.getByRole("dialog", { name: "Edit activity" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Review TypeScript")).toHaveCount(0);
});

test("calendar shows activity titles and opens the editor", async ({ page }) => {
  await createLearningActivity(page);
  await page.goto("/calendar");
  await expect(page.getByText("Study TypeScript")).toBeVisible();
  await page.getByText("Study TypeScript").click();
  await expect(page.getByRole("dialog", { name: "Edit activity" })).toBeVisible();
});

test("reflection switches to saved journal mode", async ({ page }) => {
  await page.goto("/reflection");
  await page.getByPlaceholder("Write what comes to mind...").first().fill("I made space for focused work.");
  await page.getByRole("button", { name: "Save reflection" }).click();
  await expect(page.getByText("I made space for focused work.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(page.getByText(/Last saved/)).toBeVisible();
});

test("focus timer reviews details before saving", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByPlaceholder("What will you focus on?").fill("Draft release notes");
  await page.getByRole("button", { name: "Start Focus" }).click();
  await expect(page.getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();

  const dialog = page.getByRole("dialog", { name: "Review focus activity" });
  await expect(dialog.getByText("Nothing is saved until you confirm.")).toBeVisible();
  await dialog.getByLabel("Activity title").fill("Write release notes");
  await dialog.getByRole("button", { name: "Admin" }).click();
  await dialog.getByLabel(/Notes/).fill("Covered the launch changes.");
  await dialog.getByRole("button", { name: "Save activity" }).click();
  await expect(page.getByText("Write release notes").first()).toBeVisible();
});
