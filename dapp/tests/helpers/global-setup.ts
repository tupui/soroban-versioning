// Global setup to prevent Vitest expect collision
export default async function globalSetup() {
  try {
    // Clear any Vitest expect matchers that might conflict with Playwright
    const sym = Symbol.for("$$jest-matchers-object");

    // Check if the symbol exists and try to clear it safely
    if (global && typeof global === "object" && sym in global) {
      try {
        // @ts-ignore
        global[sym] = undefined;
      } catch (e: unknown) {
        // If we can't delete or modify, just ignore
        const error = e instanceof Error ? e.message : String(e);
        console.warn("Could not clear jest matchers object:", error);
      }
    }

    // Clear any other potential Vitest globals safely
    if (global && typeof global === "object") {
      // @ts-ignore
      if (global.expect && typeof global.expect === "function") {
        try {
          // @ts-ignore
          global.expect = undefined;
        } catch (e: unknown) {
          const error = e instanceof Error ? e.message : String(e);
          console.warn("Could not clear global expect:", error);
        }
      }
    }
  } catch (e: unknown) {
    // If anything fails, just log and continue
    const error = e instanceof Error ? e.message : String(e);
    console.warn("Global setup warning:", error);
  }
}
