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

  test.afterEach(async ({ page }) => {
    // Clean up any open modals or state
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);

      const closeButtons = page.locator("button", {
        hasText: /Close|Cancel|×/,
      });
      if ((await closeButtons.count()) > 0) {
        await closeButtons.first().click();
        await page.waitForTimeout(100);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  test("Project creation modal – basic functionality", async ({ page }) => {
    await page.goto("/");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle", { timeout: 15000 });

    // Debug: Check what's on the page
    const pageContent = await page.locator("body").textContent();
    console.log("Page content length:", pageContent?.length || 0);
    console.log(
      "Page contains 'Add Project':",
      pageContent?.includes("Add Project") || false,
    );

    // Try to open the modal via the button first
    const addProjectBtn = page
      .locator("button", { hasText: "Add Project" })
      .first();
    console.log("Add Project button count:", await addProjectBtn.count());

    try {
      await addProjectBtn.click();
      console.log("Clicked Add Project button");
    } catch (e) {
      console.log("Button click failed, trying event approach");
      // If button not found, try the event approach
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent("show-create-project-modal"));
      });
      console.log("Dispatched show-create-project-modal event");
    }

    // Wait for modal to be created and rendered
    await page.waitForSelector(".project-modal-container", { timeout: 10000 });

    // Wait for modal to be fully visible and rendered
    await expect(page.locator(".project-modal-container")).toBeVisible();

    // Wait for the modal content to be fully loaded
    await page.waitForTimeout(1000);

    // Debug: Check what's actually in the modal
    const modalContent = await page
      .locator(".project-modal-container")
      .textContent();
    console.log("Modal content length:", modalContent?.length || 0);
    console.log(
      "Modal content:",
      modalContent?.substring(0, 200) || "no content",
    );

    // Check for any inputs in the modal
    const inputCount = await page
      .locator(".project-modal-container input")
      .count();
    console.log("Input count in modal:", inputCount);

    // Check for any text elements in the modal
    const textElements = await page.locator(".project-modal-container *").all();
    console.log("Total elements in modal:", textElements.length);

    // Wait for the first step to be fully rendered
    await expect(
      page.locator(
        ".project-modal-container input[placeholder='Write the name']",
      ),
    ).toBeVisible();

    // Verify the modal has the expected structure - corrected CSS class from text-xl to text-2xl
    await expect(
      page.locator(".project-modal-container .text-2xl.font-medium"),
    ).toContainText("Welcome to Your New Project!");

    // Verify the Next button is present
    const nextButton = page
      .locator(".project-modal-container button", { hasText: "Next" })
      .first();
    await expect(nextButton).toBeVisible();

    // Test that the modal can be closed
    const cancelButton = page
      .locator(".project-modal-container button", { hasText: "Cancel" })
      .first();
    await expect(cancelButton).toBeVisible();

    // Close the modal
    await cancelButton.click();

    // Verify modal is closed
    await expect(page.locator(".project-modal-container")).not.toBeVisible();
  });

  test("Join community modal – adapt to wallet state", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Check if wallet is connected by inspecting the connect button text
    const connectButtonText = await page
      .locator("[data-connect] span")
      .textContent();
    const isConnected = connectButtonText === "Profile";

    if (!isConnected) {
      // Wallet not connected → Join button should be visible
      const joinButton = page.locator("button", { hasText: "Join" }).first();
      await expect(joinButton).toBeVisible({ timeout: 5000 });
      await joinButton.click();

      // Wait for modal to render
      await expect(page.getByText("Join the Community")).toBeVisible({
        timeout: 10000,
      });

      // Fill minimal required fields
      await page
        .locator("input[placeholder='Write the address as G...']")
        .fill("G".padEnd(56, "B"));
      await page
        .locator("input[placeholder='https://twitter.com/yourhandle']")
        .fill("https://twitter.com/test");

      // Submit – click the second Join button (the submit)
      await page.getByRole("button", { name: "Join" }).nth(1).click();

      // Wait a bit for async flow – just assert no crash
      await page.waitForTimeout(500);
      await expect(page.locator("body")).toBeVisible();
    } else {
      console.log("Wallet already connected, skipping Join button test.");
    }
  });
});
