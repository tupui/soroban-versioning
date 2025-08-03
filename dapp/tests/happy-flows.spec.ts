import { test, expect } from "@playwright/test";
import { applyAllMocks } from "./helpers/mock";

/*
 * Additional happy-path coverage for the most critical user flows.
 * These tests focus on flow robustness rather than visual assertions.
 */

test.describe("Tansu dApp – Happy-path User Flows", () => {
  test.beforeEach(async ({ page }) => {
    await applyAllMocks(page);
    page.setDefaultTimeout(5_000);
  });

  test("Project creation modal – navigate through all steps", async ({
    page,
  }) => {
    await page.goto("/");

    // Programmatically open the Create-Project modal (same event Navbar/CTA triggers)
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("create-project-global"));
    });

    // Step 1 – basic info
    await expect(page.locator("label:text-is('Project Name')"), {
      message: "Modal did not open correctly",
    }).toBeVisible();
    await page.locator("input[placeholder='Write the name']").fill("flowtest");
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2 – maintainer information
    await page.locator("input[placeholder='G...']").fill("G".padEnd(56, "A"));
    await page.locator("input[placeholder='username']").fill("flowhandle");
    await page.getByRole("button", { name: "Next" }).click();

    // Step 3 – org & repo details
    await page
      .locator("input[placeholder='Your organisation / project owner name']")
      .fill("Flow Inc");
    await page
      .locator("input[placeholder='https://example.com']")
      .fill("https://flow.inc");
    await page
      .locator("textarea[placeholder='Describe your project (min 3 words)']")
      .fill("This is a test project");
    await page
      .locator("input[placeholder='Write the github repository URL']")
      .fill("https://github.com/example/repo");
    await page.getByRole("button", { name: "Next" }).click();

    // Review step visible
    await expect(
      page.getByRole("button", { name: "Register Project" }),
    ).toBeVisible();
  });

  test("Join community modal – basic happy path", async ({ page }) => {
    await page.goto("/");

    const joinButton = page.getByRole("button", { name: "Join" }).first();
    await expect(joinButton).toBeVisible();
    await joinButton.click();

    // Modal visible
    await expect(page.getByText("Join the Community")).toBeVisible();

    // Fill minimal required fields
    await page
      .locator("input[placeholder='Write the address as G...']")
      .fill("G".padEnd(56, "B"));
    await page
      .locator("input[placeholder='https://twitter.com/yourhandle']")
      .fill("https://twitter.com/test");

    // Submit
    await page.getByRole("button", { name: "Join" }).click();

    // Wait a bit for async flow – we only assert no crash occurred.
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });
});
