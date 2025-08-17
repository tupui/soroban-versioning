#!/usr/bin/env node

/**
 * Validation script to ensure contract error mapping stays in sync with bindings
 * This script should be run as part of the lint/build process
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function validateContractErrorMapping() {
  try {
    // Read the constants file
    const constantsPath = join(
      __dirname,
      "../src/constants/contractErrorMessages.ts",
    );
    const constantsContent = readFileSync(constantsPath, "utf8");

    // Extract error codes from the constants file
    const constantMatches = constantsContent.matchAll(/(\d+):\s*"[^"]+"/g);
    const constantKeys = Array.from(constantMatches, (match) =>
      parseInt(match[1]),
    ).sort((a, b) => a - b);

    // Read the bindings file
    const bindingsPath = join(__dirname, "../packages/tansu/src/index.ts");
    const bindingsContent = readFileSync(bindingsPath, "utf8");

    // Extract error codes from the bindings file
    const bindingMatches = bindingsContent.matchAll(
      /(\d+):\s*{\s*message:\s*"[^"]+"/g,
    );
    const bindingKeys = Array.from(bindingMatches, (match) =>
      parseInt(match[1]),
    ).sort((a, b) => a - b);

    console.log("🔍 Validating contract error mapping...");
    console.log(
      `📊 Bindings have ${bindingKeys.length} error codes: [${bindingKeys.join(", ")}]`,
    );
    console.log(
      `📊 Constants have ${constantKeys.length} error codes: [${constantKeys.join(", ")}]`,
    );

    // Check count mismatch
    if (bindingKeys.length !== constantKeys.length) {
      console.error(
        `❌ COUNT MISMATCH: Bindings have ${bindingKeys.length} errors, constants have ${constantKeys.length} errors`,
      );
      process.exit(1);
    }

    // Check key mismatch
    for (let i = 0; i < bindingKeys.length; i++) {
      if (bindingKeys[i] !== constantKeys[i]) {
        console.error(
          `❌ KEY MISMATCH at index ${i}: binding key ${bindingKeys[i]} vs constant key ${constantKeys[i]}`,
        );
        process.exit(1);
      }
    }

    // Check for missing error codes in constants
    const missingInConstants = bindingKeys.filter(
      (key) => !constantKeys.includes(key),
    );
    if (missingInConstants.length > 0) {
      console.error(
        `❌ MISSING IN CONSTANTS: Error codes [${missingInConstants.join(", ")}] are in bindings but not in constants`,
      );
      process.exit(1);
    }

    // Check for extra error codes in constants
    const extraInConstants = constantKeys.filter(
      (key) => !bindingKeys.includes(key),
    );
    if (extraInConstants.length > 0) {
      console.error(
        `❌ EXTRA IN CONSTANTS: Error codes [${extraInConstants.join(", ")}] are in constants but not in bindings`,
      );
      process.exit(1);
    }

    console.log("✅ Contract error mapping validation passed!");
    console.log(
      "📝 All error codes are properly synchronized between bindings and constants.",
    );
  } catch (error) {
    console.error("❌ Validation failed:", error.message);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateContractErrorMapping();
}

export { validateContractErrorMapping };
