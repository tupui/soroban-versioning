import { test } from "@playwright/test";

test("Submit proposal", async ({ page }) => {
  await page.goto("/governance?name=tansu");
  await page.getByRole("button", { name: "Submit proposal" }).click();
});

test("Go to project detail page", async ({ page }) => {
  await page.goto("/governance?name=tansu");
  await page.getByText("0Add a DAO systemCancelled").click();
});
