// @ts-nocheck
import { test, expect } from "@playwright/test";
import { applyAllMocks } from "./helpers/mock";
import { MOCK_PROJECT, WALLET_PK } from "./helpers/data";

test.describe("Project registration flow", () => {
  test.beforeEach(async ({ page }) => applyAllMocks(page));

  test("user can register a new project end-to-end", async ({ page }) => {
    // 1️⃣ Visit home dashboard
    await page.goto("/");

    // 2️⃣ Wait for home content to load then request opening create-project modal
    await page.waitForSelector("text=Featured Projects");

    // Use the indirection used by Navbar to ensure all listeners run
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("show-create-project-modal"));
    });

    // Ensure the first step is visible
    await expect(page.getByText("Welcome to Your New Project!")).toBeVisible({
      timeout: 10000,
    });

    // Step 1 – basic info
    await page.fill('input[placeholder="Write the name"]', MOCK_PROJECT.name);
    await page
      .locator('button:has-text("Next")', { hasText: "Next" })
      .first()
      .click();
    await page.waitForSelector("text=Build Your Team");

    // Step 2 – maintainers
    await page.fill(
      'input[placeholder="Write the maintainer\'s address as G..."]',
      WALLET_PK,
    );
    await page
      .locator('button:has-text("Next")', { hasText: "Next" })
      .first()
      .click();
    await page.waitForSelector("text=Add Supporting Materials");

    // Step 3 – supporting materials
    await page.fill(
      'input[placeholder="Write the information file hash"]',
      MOCK_PROJECT.config_hash,
    );
    await page.fill(
      'input[placeholder="Write the github repository URL"]',
      MOCK_PROJECT.config_url,
    );
    await page
      .locator('button:has-text("Next")', { hasText: "Next" })
      .first()
      .click();
    await page.waitForSelector("text=Review and Submit Your Project", {
      timeout: 10000,
    });
    await page.waitForSelector("#register-project-button", { timeout: 10000 });

    // Step 4 – review & register
    await expect(page.locator("#register-project-button")).toBeVisible();
    await page.click("#register-project-button");

    // 5️⃣ Wait for navigation to the new project page and verify URL
    await page.waitForURL(`**/project?name=${MOCK_PROJECT.name}`);
    await expect(page).toHaveURL(/project\?name=/);

    // Verify project info heading or name appears in page
    await expect(
      page.getByText(MOCK_PROJECT.name, { exact: false }),
    ).toBeVisible();
  });
});
