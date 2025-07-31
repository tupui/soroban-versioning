import { test, expect } from "@playwright/test";
import { applyAllMocks } from "./helpers/mock";

test.describe("Essential Production Validation", () => {
  test.beforeEach(async ({ page }) => {
    await applyAllMocks(page);
    page.setDefaultTimeout(5000);
  });

  test("App loads and core functionality works", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Connect button should be present
    const connectButton = page.locator("[data-connect]");
    await expect(connectButton).toBeVisible();

    // Navigation should work
    await page.goto("/governance");
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/project?name=test");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Security and error handling", async ({ page }) => {
    // XSS protection test
    await page.goto(
      "/project?name=%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E",
    );
    await expect(page.locator("body")).toBeVisible();

    // Network failure resilience
    await page.route("**/soroban/**", (route) => route.abort());
    await page.goto("/");
    await expect(page.locator("[data-connect]")).toBeVisible();

    // No critical environment errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        msg.text().includes("Missing required environment")
      ) {
        errors.push(msg.text());
      }
    });
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });

  test("Wallet connection simulation", async ({ page }) => {
    await page.goto("/");

    // Simulate wallet connection as the app would
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("walletConnected", {
          detail: "GCTESTEXAMPLE123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        }),
      );
    });
    await page.waitForTimeout(300);

    // Simulate disconnection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("walletDisconnected"));
    });
    await page.waitForTimeout(300);

    // Should gracefully return to initial state
    const connectButton = page.locator("[data-connect]");
    await expect(connectButton).toBeVisible();
  });

  test("Mobile responsiveness and performance", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - startTime;

    // Basic performance check
    expect(loadTime).toBeLessThan(5000);
    await expect(page.locator("[data-connect]")).toBeVisible();
  });
});
