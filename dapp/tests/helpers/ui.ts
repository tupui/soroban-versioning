// Utility helpers for Playwright E2E tests
// @ts-nocheck
export async function clickAndWait(page, selector, opts = {}) {
  await page.waitForSelector(selector, { state: "visible", timeout: 10000 });
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.click(selector, opts),
  ]);
}
