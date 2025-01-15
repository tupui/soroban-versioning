import { test, expect } from "@playwright/test";

test("connect-wallet", async ({ page }) => {
  await page.goto("http://localhost:4321/");
  await page.locator("div").filter({ hasText: "Connect" }).nth(3).click();
  await page.getByRole("dialog").getByRole("button").click();
});

test("find-project", async ({ page }) => {
  await page.goto("http://localhost:4321/");
  await page.getByPlaceholder("Search or register a project").click();
  await page.getByPlaceholder("Search or register a project").fill("tansu");
  await expect(page.getByRole("img", { name: "tansu" })).toBeVisible();
});

test("register-project", async ({ page }) => {
  await page.goto("http://localhost:4321/");
  await page.getByPlaceholder("Search or register a project").click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByPlaceholder("Search or register a project").fill("zxcv");
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByRole("button", { name: "Register on-chain" }).click();
  await expect(page.getByText("Maintainers cannot be empty")).toBeVisible();
  await expect(page.getByText("Invalid GitHub repository URL")).toBeVisible();
  await expect(page.getByText("File hash must be 64")).toBeVisible();
});

test("go-to-project-page", async ({ page }) => {
  await page.goto("http://localhost:4321/");
  await page.getByPlaceholder("Search or register a project").click();
  await page.getByPlaceholder("Search or register a project").fill("tansu");
  await page.getByRole("img", { name: "tansu" }).click();
  await page.getByRole("button", { name: "Detail ->" }).click();
});
