import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? "inherit" : 2, // ✅ Fix here
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
    webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});


// export default defineConfig({
//   testDir: "./e2e",
//   fullyParallel: true,
//   forbidOnly: !!process.env.CI,
//   retries: process.env.CI ? 2 : 0,
//   workers: process.env.CI ? "inherit" : 2, // ✅ Fixed
//   reporter: "html",
//   timeout: 240000,
//   use: {
//     baseURL: "http://localhost:4321",
//     trace: "on-first-retry",
//   },
//   projects: [
//     {
//       name: "chromium",
//       use: { ...devices["Desktop Chrome"] },
//     },
//     {
//       name: "firefox",
//       use: { ...devices["Desktop Firefox"] },
//     },
//     {
//       name: "webkit",
//       use: { ...devices["Desktop Safari"] },
//     },
//   ],
//   webServer: {
//     command: "bun dev",
//     url: "http://127.0.0.1:4321",
//     reuseExistingServer: !process.env.CI,
//   },
// });

