// @ts-nocheck
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "**/essential-flows.spec.ts",
    "**/comprehensive-flows.spec.ts",
    "**/regression-prevention.spec.ts",
    "**/governance-flows.spec.ts",
    "**/happy-flows.spec.ts",
  ],

  // Performance optimizations
  timeout: 30000,
  expect: { timeout: 5000 },
  actionTimeout: 5000,
  navigationTimeout: 10000,

  // Fast execution settings
  fullyParallel: true,
  retries: 0,
  // Use more workers locally for speed; keep single worker on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Minimal reporting for speed
  reporter: [["line"]],

  // No screenshots/videos for performance
  use: {
    trace: "off",
    screenshot: "off",
    video: "off",

    // Fast Chrome settings
    launchOptions: {
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "bun dev",
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
