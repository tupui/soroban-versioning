import { test, expect } from "@playwright/test";
import { applyMinimalMocks, applyDiagnosticMocks } from "./helpers/mock";

/**
 * Regression Prevention Tests
 *
 * These tests are specifically designed to catch the exact types of errors
 * that slipped through our previous test suite:
 *
 * 1. "setShowProfileModal is not defined" - State variable mismatches
 * 2. "Invalid contract ID: undefined" - Environment variable issues
 * 3. "assembledTx.signedXDRToResult is not a function" - SDK method signature errors
 * 4. "Cannot read properties of undefined (reading 'switch')" - XDR parsing errors
 */
test.describe("🚨 Regression Prevention - Critical Error Detection", () => {
  let allConsoleErrors: string[] = [];
  let allPageErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking
    allConsoleErrors = [];
    allPageErrors = [];

    // Capture ALL errors with detailed logging
    page.on("pageerror", (error) => {
      const errorMsg = `PageError: ${error.message}`;
      allPageErrors.push(errorMsg);
      console.error("[REGRESSION TEST]", errorMsg);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const errorText = msg.text();
        allConsoleErrors.push(errorText);

        // Log specific patterns we're watching for
        if (
          errorText.includes("is not defined") ||
          errorText.includes("Cannot read properties of undefined") ||
          errorText.includes("is not a function") ||
          errorText.includes("Invalid contract ID: undefined")
        ) {
          console.error("[REGRESSION TEST] CRITICAL ERROR:", errorText);
        }
      }
    });

    page.setDefaultTimeout(8000);
  });

  test("CRITICAL: No undefined state setter errors (JoinCommunityButton regression)", async ({
    page,
  }) => {
    await applyMinimalMocks(page);

    // This exact scenario caused the setShowProfileModal error
    await page.goto("/project?name=tansu");
    await page.waitForTimeout(2000); // Give time for all React components to mount

    // Specifically check for the exact errors we fixed
    const stateSetterErrors = allConsoleErrors.filter(
      (error) =>
        error.includes("setShowProfileModal is not defined") ||
        error.includes("setIsMember is not defined") ||
        error.includes("setMemberData is not defined") ||
        error.includes("setShowJoinModal is not defined"),
    );

    if (stateSetterErrors.length > 0) {
      console.error(
        "🚨 REGRESSION: State setter errors detected!",
        stateSetterErrors,
      );
      throw new Error(
        `REGRESSION DETECTED: State setter errors found: ${stateSetterErrors.join(", ")}`,
      );
    }

    expect(stateSetterErrors).toHaveLength(0);
    expect(allPageErrors).toHaveLength(0);
  });

  test("CRITICAL: No invalid contract ID errors", async ({ page }) => {
    await applyMinimalMocks(page);

    // Test all pages that use contract services
    const contractPages = [
      "/",
      "/project?name=test",
      "/governance?name=test",
      "/proposal?name=test&id=1",
    ];

    for (const pagePath of contractPages) {
      await page.goto(pagePath);
      await page.waitForTimeout(1000);

      // Check for the specific contract ID error we fixed
      const contractIdErrors = allConsoleErrors.filter(
        (error) =>
          error.includes("Invalid contract ID: undefined") ||
          error.includes("PUBLIC_TANSU_CONTRACT_ID is not defined") ||
          error.includes("PUBLIC_SOROBAN_CONTRACT_ID"),
      );

      if (contractIdErrors.length > 0) {
        console.error(
          `🚨 REGRESSION: Contract ID errors on ${pagePath}:`,
          contractIdErrors,
        );
        throw new Error(
          `REGRESSION DETECTED: Contract ID errors on ${pagePath}: ${contractIdErrors.join(", ")}`,
        );
      }

      expect(contractIdErrors).toHaveLength(0);
    }
  });

  test("CRITICAL: No SDK method signature errors", async ({ page }) => {
    await applyMinimalMocks(page);

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Test that ContractService can be imported without method signature errors
    const contractServiceTest = await page.evaluate(async () => {
      try {
        // Import all the contract service methods that had issues
        const {
          commitHash,
          voteToProposal,
          execute,
          addBadges,
          setupAnonymousVoting,
        } = await import("./src/service/ContractService.ts");

        // Verify all methods exist and are functions
        const methods = {
          commitHash,
          voteToProposal,
          execute,
          addBadges,
          setupAnonymousVoting,
        };
        const results = {};

        for (const [name, method] of Object.entries(methods)) {
          results[name] = typeof method === "function";
        }

        return { success: true, methods: results, error: null };
      } catch (error) {
        return { success: false, methods: {}, error: error.message };
      }
    });

    expect(contractServiceTest.success).toBe(true);
    expect(contractServiceTest.methods.commitHash).toBe(true);
    expect(contractServiceTest.methods.voteToProposal).toBe(true);
    expect(contractServiceTest.methods.execute).toBe(true);

    // Check for the specific SDK method errors we fixed
    const sdkMethodErrors = allConsoleErrors.filter(
      (error) =>
        error.includes("signedXDRToResult is not a function") ||
        error.includes("signAndSend is not a function") ||
        error.includes("toXDR is not a function") ||
        error.includes("simulate is not a function") ||
        error.includes("prepare is not a function"),
    );

    if (sdkMethodErrors.length > 0) {
      console.error(
        "🚨 REGRESSION: SDK method signature errors!",
        sdkMethodErrors,
      );
      throw new Error(
        `REGRESSION DETECTED: SDK method errors: ${sdkMethodErrors.join(", ")}`,
      );
    }

    expect(sdkMethodErrors).toHaveLength(0);
  });

  test("CRITICAL: No XDR parsing or transaction flow errors", async ({
    page,
  }) => {
    await applyMinimalMocks(page);

    await page.goto("/project?name=test");
    await page.waitForTimeout(1500);

    // Simulate the contract service initialization that was failing
    const transactionTest = await page.evaluate(async () => {
      try {
        // Test the exact flow that was failing
        const { commitHash } = await import("./src/service/ContractService.ts");

        // This should not throw switch/XDR parsing errors during initialization
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(transactionTest.success).toBe(true);

    // Check for the specific XDR/transaction errors we fixed
    const xdrErrors = allConsoleErrors.filter(
      (error) =>
        error.includes(
          "Cannot read properties of undefined (reading 'switch')",
        ) ||
        error.includes("Bad union switch: 4") ||
        error.includes(
          "Transaction failed: Cannot read properties of undefined",
        ) ||
        error.includes("AssembledTransaction") ||
        error.includes("XDR parsing"),
    );

    if (xdrErrors.length > 0) {
      console.error(
        "🚨 REGRESSION: XDR/Transaction parsing errors!",
        xdrErrors,
      );
      throw new Error(
        `REGRESSION DETECTED: XDR errors: ${xdrErrors.join(", ")}`,
      );
    }

    expect(xdrErrors).toHaveLength(0);
  });

  test("CRITICAL: All React components mount without errors", async ({
    page,
  }) => {
    await applyMinimalMocks(page);

    // Test components that had mounting issues
    const componentTests = [
      { url: "/", component: "JoinCommunityButton" },
      { url: "/project?name=test", component: "UpdateHashModal" },
      { url: "/governance", component: "ProposalsSection" },
      { url: "/proposal?name=test&id=1", component: "VotingModal" },
    ];

    for (const { url, component } of componentTests) {
      await page.goto(url);
      await page.waitForTimeout(1500); // Allow full React hydration

      // Check for React component errors
      const reactErrors = allConsoleErrors.filter(
        (error) =>
          error.includes("is not defined") ||
          error.includes("Cannot read properties of undefined") ||
          (error.includes("TypeError") && !error.includes("network")) ||
          error.includes("ReferenceError"),
      );

      if (reactErrors.length > 0) {
        console.error(
          `🚨 REGRESSION: React component errors on ${url} (${component}):`,
          reactErrors,
        );
        throw new Error(
          `REGRESSION DETECTED: Component errors on ${url}: ${reactErrors.join(", ")}`,
        );
      }

      expect(reactErrors).toHaveLength(0);
    }

    // No page-level JavaScript errors should occur
    expect(allPageErrors).toHaveLength(0);
  });

  test("DIAGNOSTIC: Log and validate mocking strategy", async ({ page }) => {
    await applyDiagnosticMocks(page);

    await page.goto("/project?name=test");
    await page.waitForTimeout(1000);

    // This test helps us understand what our mocks are intercepting
    // and ensures our mocking strategy is appropriate

    // Should still work without critical errors even with diagnostic logging
    const diagnosticErrors = allConsoleErrors.filter(
      (error) =>
        !error.includes("[MOCK]") && // Ignore mock logs
        (error.includes("is not defined") ||
          error.includes("Cannot read properties of undefined")),
    );

    expect(diagnosticErrors).toHaveLength(0);

    console.log(
      `✅ Diagnostic test completed. Total console messages: ${allConsoleErrors.length}`,
    );
  });
});
