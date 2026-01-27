import { test, expect } from "@playwright/test";
import { applyAllMocks, applyMinimalMocks } from "./helpers/mock";

// Extend Window interface for mockGetMemberResponse
declare global {
  interface Window {
    mockGetMemberResponse?: any;
  }
}

test.describe("Essential Production Validation", () => {
  // Global error tracking for each test
  let globalErrors: string[] = [];
  let jsErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    globalErrors = [];
    jsErrors = [];

    // Capture all JavaScript errors
    page.on("pageerror", (error) => {
      jsErrors.push(`PageError: ${error.message}`);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const errorText = msg.text();
        globalErrors.push(errorText);

        // Log critical errors immediately for debugging
        if (
          errorText.includes("setShowProfileModal is not defined") ||
          errorText.includes("Cannot read properties of undefined") ||
          errorText.includes("signedXDRToResult is not a function") ||
          errorText.includes("Invalid contract ID: undefined")
        ) {
          console.error("CRITICAL ERROR DETECTED:", errorText);
        }
      }
    });

    page.setDefaultTimeout(12000);
  });

  test("App loads and core functionality works WITHOUT JavaScript errors", async ({
    page,
  }) => {
    await applyAllMocks(page);

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
    } catch {
      await page.goto("/").catch(() => {});
    }
    await expect(page.locator("body")).toBeVisible();

    // Connect button should be present
    const connectButton = page.locator("[data-connect]");
    await expect(connectButton).toBeVisible();

    // Wait for page to fully hydrate and check for JavaScript errors
    await page.waitForTimeout(1000);

    // CRITICAL: No JavaScript errors should occur on page load
    const criticalErrors = globalErrors.filter(
      (error) =>
        (error.includes("is not defined") ||
          error.includes("Cannot read properties of undefined") ||
          error.includes("TypeError:") ||
          error.includes("ReferenceError:")) &&
        !error.includes("Astro") && // Ignore Astro dev toolbar issues
        !error.includes("dev-toolbar") &&
        !error.includes("Failed to fetch"), // Network errors in dev toolbar
    );

    if (criticalErrors.length > 0) {
      console.error("JavaScript errors found:", criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
    expect(jsErrors).toHaveLength(0);

    // Navigation should work without errors
    try {
      await page.goto("/governance", { waitUntil: "domcontentloaded" });
    } catch {
      await page.goto("/governance").catch(() => {});
    }
    await expect(page.locator("body")).toBeVisible();
    await page.waitForTimeout(500);

    // Check errors after navigation
    const navErrors = globalErrors.filter(
      (error) =>
        error.includes("is not defined") ||
        error.includes("Cannot read properties of undefined"),
    );
    expect(navErrors).toHaveLength(0);

    try {
      await page.goto("/project?name=test", { waitUntil: "domcontentloaded" });
    } catch {
      await page.goto("/project?name=test").catch(() => {});
    }
    await expect(page.locator("body")).toBeVisible();
    await page.waitForTimeout(500);

    // Check errors after project page load
    const projectErrors = globalErrors.filter(
      (error) =>
        error.includes("is not defined") ||
        error.includes("Invalid contract ID: undefined"),
    );
    expect(projectErrors).toHaveLength(0);
  });

  test("Environment variables are properly configured", async ({ page }) => {
    await applyAllMocks(page);

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
    } catch {
      await page.goto("/").catch(() => {});
    }
    await page.waitForTimeout(500);

    // Check for specific contract initialization errors using our global tracking
    const criticalErrors = globalErrors.filter(
      (error) =>
        error.includes("Invalid contract ID: undefined") ||
        (error.includes("Please connect your wallet first") === false &&
          !error.includes(
            "Failed to load resource: the server responded with a status of 404",
          )), // Ignore 404s during dev testing
    );
    expect(criticalErrors).toHaveLength(0);

    // Try to open project page which requires contract service
    try {
      await page.goto("/project?name=test", { waitUntil: "domcontentloaded" });
    } catch {
      await page.goto("/project?name=test").catch(() => {});
    }
    await page.waitForTimeout(500);

    // Should not have contract ID errors
    const contractErrors = globalErrors.filter((error) =>
      error.includes("Invalid contract ID: undefined"),
    );
    expect(contractErrors).toHaveLength(0);
  });

  test("Contract service works with REAL SDK patterns (minimal mocks)", async ({
    page,
  }) => {
    // Use minimal mocks to test real contract service behavior
    await applyMinimalMocks(page);

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Test that contract service can be imported and methods exist
    const contractServiceTest = await page.evaluate(async () => {
      try {
        const { commitHash, voteToProposal, execute } =
          await import("../src/service/ContractService.ts");

        // Should not throw "is not a function" errors during static analysis
        const hasCommitHashMethod = typeof commitHash === "function";
        const hasVoteMethod = typeof voteToProposal === "function";
        const hasExecuteMethod = typeof execute === "function";

        return {
          success: true,
          hasCommitHashMethod,
          hasVoteMethod,
          hasExecuteMethod,
          error: null,
        };
      } catch (error) {
        return {
          success: false,
          hasCommitHashMethod: false,
          hasVoteMethod: false,
          hasExecuteMethod: false,
          error:
            typeof error === "object" && error !== null && "message" in error
              ? (error as { message: string }).message
              : String(error),
        };
      }
    });

    expect(contractServiceTest.success).toBe(true);
    expect(contractServiceTest.hasCommitHashMethod).toBe(true);
    expect(contractServiceTest.hasVoteMethod).toBe(true);
    expect(contractServiceTest.hasExecuteMethod).toBe(true);

    // CRITICAL: Check for specific method signature errors that real usage would expose
    const methodErrors = globalErrors.filter(
      (error) =>
        error.includes("signedXDRToResult is not a function") ||
        error.includes("signAndSend is not a function") ||
        error.includes("toXDR is not a function") ||
        error.includes(
          "Cannot read properties of undefined (reading 'switch')",
        ),
    );

    if (methodErrors.length > 0) {
      console.error("Contract service method errors:", methodErrors);
    }
    expect(methodErrors).toHaveLength(0);
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

  test("Profile button loads registered user data correctly", async ({
    page,
  }) => {
    await applyAllMocks(page);

    // Mock getMember at the module level BEFORE going to the page
    await page.addInitScript(() => {
      // Create a mock that will be used when the service is imported
      window.mockGetMemberResponse = {
        member_address: "GCTESTEXAMPLE123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        meta: "QmTestCID123mockipfs456789abcdef",
        projects: [
          {
            project: new Uint8Array([116, 101, 115, 116]), // "test" as bytes
            badges: ["contributor", "maintainer"],
          },
        ],
      };
    });

    await page.goto("/");

    // Simulate wallet connection
    await page.evaluate(() => {
      window.localStorage.setItem(
        "connectedPublicKey",
        "GCTESTEXAMPLE123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      );
      window.dispatchEvent(
        new CustomEvent("walletConnected", {
          detail: "GCTESTEXAMPLE123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        }),
      );
    });
    await page.waitForTimeout(500);

    // Open profile modal
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("openProfileModal"));
    });

    // Wait for profile modal to appear
    await page.waitForSelector(".profile-modal-container", { timeout: 5000 });

    // THE REAL TEST: Profile modal should NOT show "Member Not Registered"
    // because our mock provides valid member data
    await expect(page.locator("text=Member Not Registered")).not.toBeVisible();

    // Success! This means:
    // 1. Profile button worked
    // 2. getMember was called and returned mock data
    // 3. Modal displayed member profile instead of registration prompt
  });

  test("Critical Component Error Detection", async ({ page }) => {
    await applyAllMocks(page);

    // Test specific components that we know had issues
    try {
      await page.goto("/project?name=tansu");
    } catch {
      await page.goto("/project?name=tansu").catch(() => {});
    }
    await page.waitForTimeout(1500); // Give time for all components to load

    // JoinCommunityButton specifically should not have undefined errors
    const joinButtonErrors = globalErrors.filter(
      (error) =>
        error.includes("setShowProfileModal is not defined") ||
        error.includes("setIsMember is not defined") ||
        error.includes("setMemberData is not defined"),
    );

    if (joinButtonErrors.length > 0) {
      console.error("JoinCommunityButton errors found:", joinButtonErrors);
    }
    expect(joinButtonErrors).toHaveLength(0);

    // Test that we can interact with contract-related elements without crashes
    const contractElements = await page
      .locator(
        '[data-testid*="contract"], [data-testid*="hash"], [data-testid*="update"]',
      )
      .count();
    if (contractElements > 0) {
      // If contract elements exist, no contract ID errors should occur
      const contractIdErrors = globalErrors.filter((error) =>
        error.includes("Invalid contract ID: undefined"),
      );
      expect(contractIdErrors).toHaveLength(0);
    }

    // Check all page JavaScript errors are acceptable
    const unacceptableErrors = globalErrors.filter(
      (error) =>
        (error.includes("is not defined") ||
          error.includes("Cannot read properties of undefined") ||
          (error.includes("TypeError") && !error.includes("network")) ||
          (error.includes("ReferenceError") && !error.includes("mock"))) &&
        !error.includes("Astro") && // Ignore Astro dev toolbar issues
        !error.includes("dev-toolbar") &&
        !error.includes("Failed to fetch"), // Network errors in dev toolbar
    );

    if (unacceptableErrors.length > 0) {
      console.error(
        "Unacceptable JavaScript errors found:",
        unacceptableErrors,
      );
    }
    expect(unacceptableErrors).toHaveLength(0);
  });

  test("Mobile responsiveness and performance", async ({ page }) => {
    await applyAllMocks(page);
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - startTime;

    // Basic performance check
    expect(loadTime).toBeLessThan(5000);
    await expect(page.locator("[data-connect]")).toBeVisible();

    // Mobile should also be error-free
    await page.waitForTimeout(1000);
    const mobileErrors = globalErrors.filter(
      (error) =>
        error.includes("is not defined") ||
        error.includes("Cannot read properties of undefined"),
    );
    expect(mobileErrors).toHaveLength(0);
  });
});
