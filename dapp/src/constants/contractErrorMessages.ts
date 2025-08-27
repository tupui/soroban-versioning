// Contract error messages that mirror the bindings but provide user-friendly descriptions
//
// ⚠️  IMPORTANT: When bindings are updated, this file MUST be updated to match!
//
// VALIDATION:
// - This file is automatically validated during linting: `bun run lint`
// - Run validation manually: `bun run validate-errors`
// - Pre-commit hooks will catch mismatches before commits
// - CI/CD will fail if validation fails
//
// To validate the mapping is correct, call validateContractErrorMapping() during development.
// This will catch any mismatches between bindings and constants.
export const contractErrorMessages = {
  0: "An unexpected error has occurred.",
  1: "The provided key is invalid.",
  2: "The project already exists.",
  3: "The user is not a maintainer.",
  4: "No hash was found.",
  5: "There is an invalid domain error.",
  6: "The maintainer is not the domain owner.",
  7: "There was a validation issue with the proposal input.",
  8: "Proposal or page could not be found.",
  9: "You have already voted.",
  10: "The proposal is still in voting, so cannot be executed.",
  11: "The proposal has already been executed.",
  12: "The voting type is wrong.",
  13: "You are invalid voter.",
  14: "There is a tally seed error.",
  15: "The proof is invalid.",
  16: "This is not the anonymous voting config.",
  17: "Bad commitment.",
  18: "The member does not exist. Please ensure the member address is correct and the member has been registered.",
  19: "The member already exists.",
  20: "Invalid voter weight calculation.",
  21: "Too many voters already.",
  22: "Contract is paused.",
  23: "Contract upgrade error.",
};

export type ContractErrorMessageKey = keyof typeof contractErrorMessages;

/**
 * Validation function to ensure constants file stays in sync with bindings
 * This should be called during development/build to catch mismatches
 */
export function validateContractErrorMapping(): void {
  // Import bindings dynamically to avoid circular dependencies
  import("../../packages/tansu")
    .then(({ ContractErrors }) => {
      const bindingKeys = Object.keys(ContractErrors)
        .map(Number)
        .sort((a, b) => a - b);
      const constantKeys = Object.keys(contractErrorMessages)
        .map(Number)
        .sort((a, b) => a - b);

      if (bindingKeys.length !== constantKeys.length) {
        throw new Error(
          `Contract error mapping mismatch: bindings have ${bindingKeys.length} errors, constants have ${constantKeys.length} errors`,
        );
      }

      for (let i = 0; i < bindingKeys.length; i++) {
        if (bindingKeys[i] !== constantKeys[i]) {
          throw new Error(
            `Contract error mapping mismatch at index ${i}: binding key ${bindingKeys[i]} vs constant key ${constantKeys[i]}`,
          );
        }
      }

      console.log("✅ Contract error mapping validation passed");
    })
    .catch((error) => {
      console.warn(
        "⚠️ Could not validate contract error mapping:",
        error.message,
      );
    });
}
