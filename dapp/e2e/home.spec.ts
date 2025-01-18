import { test, expect } from "@playwright/test";

test("Find project", async ({ page }) => {
  await page.goto("http://localhost:4321/");
  await page.getByPlaceholder("Search or register a project").click();
  await page.getByPlaceholder("Search or register a project").fill("tansu");
  await expect(page.getByRole("img", { name: "tansu" })).toBeVisible();
});

test("Go to project page", async ({ page }) => {
  await page.goto("http://localhost:4321/");
  await page.getByPlaceholder("Search or register a project").click();
  await page.getByPlaceholder("Search or register a project").fill("tansu");
  await page.getByRole("img", { name: "tansu" }).click();
  await page.getByRole("button", { name: "Detail ->" }).click();
});
