import { test } from "@playwright/test";

test("go-to-governance", async ({ page }) => {
  await page.goto("http://localhost:4321/project?name=tansu");
  await page.getByRole("button", { name: "Governance ->" }).click();
});

test("support", async ({ page }) => {
  await page.goto("http://localhost:4321/project?name=tansu");
  await page.getByRole("button", { name: "♥ Support" }).click();
  await page.locator("#donate-modal").click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Contribute to tansu.xlm" }).click();
});
