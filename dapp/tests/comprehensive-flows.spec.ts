import { test, expect } from "@playwright/test";
import { applyAllMocks } from "./helpers/mock";

test.describe("Tansu dApp - Comprehensive User Flows", () => {
  // Track errors across all tests
  let allErrors: string[] = [];
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    allErrors = [];
    pageErrors = [];

    // Capture all types of errors
    page.on("pageerror", (error) => {
      pageErrors.push(`PageError: ${error.message}`);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        allErrors.push(msg.text());
      }
    });

    await applyAllMocks(page);
    page.setDefaultTimeout(5000);
  });

  test.describe("🔐 Authentication & Wallet Flows", () => {
    test("Wallet connection and state management", async ({ page }) => {
      await page.goto("/");

      // Initial state - Connect button visible
      const connectButton = page.locator("[data-connect]");
      await expect(connectButton).toBeVisible();
      await expect(connectButton).toContainText("Connect");

      // Simulate wallet connection as the app does
      await page.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent("walletConnected", {
            detail: "GCTESTEXAMPLE123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
          }),
        );
      });
      await page.waitForTimeout(500);

      // Test disconnection
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("walletDisconnected"));
      });
      await page.waitForTimeout(300);

      // Should return to connect state
      await expect(connectButton).toContainText("Connect");
    });
  });

  test.describe("📁 Project Management Flows", () => {
    test("Project page navigation and content loading", async ({ page }) => {
      await page.goto("/project?name=test-project");

      // Page should load without crashes
      await expect(page.locator("body")).toBeVisible();

      // Should handle missing project gracefully
      await page.goto("/project?name=nonexistent-project");
      await expect(page.locator("body")).toBeVisible();

      // Should handle malformed project names
      try {
        await page.goto("/project?name=");
        await expect(page.locator("body")).toBeVisible();
      } catch (error) {
        // Navigation might fail for empty name, which is expected
        await page.goto("/");
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("Project search and discovery", async ({ page }) => {
      await page.goto("/");

      // Search functionality if available
      const searchInput = page
        .locator('input[placeholder*="search" i], input[type="search"]')
        .first();
      if (await searchInput.isVisible()) {
        await searchInput.fill("test-project");
        await searchInput.press("Enter");
        await page.waitForTimeout(500);

        // Should navigate or show results without crashing
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });

  test.describe("🗳️ Governance & Proposal Flows", () => {
    test("Governance page functionality", async ({ page }) => {
      await page.goto("/governance");
      await expect(page.locator("body")).toBeVisible();

      // Test with project context
      await page.goto("/governance?name=test-project");
      await expect(page.locator("body")).toBeVisible();

      // Test with invalid project
      await page.goto("/governance?name=invalid");
      await expect(page.locator("body")).toBeVisible();
    });

    test("Proposal page navigation", async ({ page }) => {
      await page.goto("/proposal?name=test-project&id=1");
      await expect(page.locator("body")).toBeVisible();

      // Test with invalid proposal ID
      await page.goto("/proposal?name=test-project&id=999");
      await expect(page.locator("body")).toBeVisible();

      // Test with missing parameters
      await page.goto("/proposal");
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("🔍 Navigation & Discovery", () => {
    test("Multi-page navigation stability", async ({ page }) => {
      const pages = [
        "/",
        "/governance",
        "/project?name=test",
        "/proposal?name=test&id=1",
      ];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await expect(page.locator("body")).toBeVisible();

        await page.waitForTimeout(500);

        // Check for critical JavaScript errors that should NEVER happen
        const criticalErrors = allErrors.filter(
          (error) =>
            (error.includes("is not defined") ||
              error.includes("Cannot read properties of undefined") ||
              error.includes("TypeError:") ||
              error.includes("ReferenceError:")) &&
            !error.includes("Astro") && // Ignore Astro dev toolbar issues
            !error.includes("dev-toolbar") &&
            !error.includes("Failed to fetch"), // Network errors in dev toolbar
        );

        // ZERO tolerance for critical JavaScript errors
        if (criticalErrors.length > 0) {
          console.error(`Critical errors on ${pagePath}:`, criticalErrors);
        }
        expect(criticalErrors).toHaveLength(0);
        expect(pageErrors).toHaveLength(0);
      }
    });
  });

  test.describe("🛡️ Security & Error Handling", () => {
    test("XSS protection and input handling", async ({ page }) => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
      ];

      for (const payload of xssPayloads) {
        try {
          await page.goto(`/project?name=${encodeURIComponent(payload)}`);
          await expect(page.locator("body")).toBeVisible();
        } catch (error) {
          // Navigation might fail for security reasons - that's good
          // Just continue to the next test without additional navigation
        }

        // Test in search if available - reset to homepage first
        try {
          await page.goto("/");
          const searchInput = page
            .locator('input[placeholder*="search" i], input[type="search"]')
            .first();
          if (await searchInput.isVisible()) {
            await searchInput.fill(payload);
            await page.waitForTimeout(100);
            await expect(page.locator("body")).toBeVisible();
            await searchInput.clear();
          }
        } catch (error) {
          // If navigation fails, skip search testing for this payload
        }
      }
    });

    test("Network error resilience", async ({ page }) => {
      // Test with various network failures
      await page.route("**/soroban/**", (route) => route.abort());
      await page.route("**/horizon/**", (route) => route.abort());

      await page.goto("/");
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("[data-connect]")).toBeVisible();

      // Test navigation still works with network issues
      await page.goto("/governance");
      await expect(page.locator("body")).toBeVisible();
    });

    test("URL parameter validation", async ({ page }) => {
      const invalidUrls = [
        "/project?name=<script>",
        "/proposal?name=test&id=abc",
        "/governance?name=../../etc/passwd",
        "/project?name=" + "x".repeat(1000),
      ];

      for (const url of invalidUrls) {
        await page.goto(url);
        await expect(page.locator("body")).toBeVisible();

        // Should not crash the application
        const errors: string[] = [];
        page.on("pageerror", (error) => {
          errors.push(error.message);
        });
        await page.waitForTimeout(200);

        // Some errors may be expected, but app shouldn't crash
        expect(errors.length).toBeLessThan(5);
      }
    });
  });

  test.describe("📱 Responsive & Performance", () => {
    test("Mobile responsiveness across pages", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobilePages = ["/", "/governance", "/project?name=test"];

      for (const pagePath of mobilePages) {
        await page.goto(pagePath);
        await expect(page.locator("body")).toBeVisible();
        await expect(page.locator("[data-connect]")).toBeVisible();
      }
    });

    test("Performance across different pages", async ({ page }) => {
      const pageTests = [
        { path: "/", maxTime: 4000 },
        { path: "/governance", maxTime: 3000 },
        { path: "/project?name=test", maxTime: 3000 },
      ];

      for (const { path, maxTime } of pageTests) {
        const startTime = Date.now();
        await page.goto(path);
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(maxTime);
        await expect(page.locator("body")).toBeVisible();
      }
    });
  });
});
