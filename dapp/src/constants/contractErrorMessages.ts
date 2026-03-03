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
  // Generic (0-99)
  0: "An unexpected error has occurred.",

  // Authorization/Permission (100-199)
  100: "The user is not a maintainer.",
  101: "You are invalid voter.",
  102: "The maintainer is not the domain owner.",

  // Validation (200-299)
  200: "The provided key is invalid.",
  201: "The project already exists.",
  202: "Too many sub-projects. Maximum allowed is 10.",
  203: "There was a validation issue with the proposal input.",
  204: "The member does not exist. Please ensure the member address is correct and the member has been registered.",
  205: "The member already exists.",
  206: "There is an invalid domain error.",
  207: "The voting type is wrong.",
  208: "Bad commitment.",
  209: "Invalid voter weight calculation.",
  210: "Too many voters already.",

  // State (300-399)
  300: "No hash was found.",
  301: "Proposal or page could not be found.",
  302: "Project page could not be found.",
  303: "This is not the anonymous voting config.",

  // Execution/Timing (400-499)
  400: "You have already voted.",
  401: "The proposal is still in voting, so cannot be executed.",
  402: "The proposal has already been executed.",
  403: "There was an error executing outcome contracts.",

  // Voting/Cryptographic (500-599)
  500: "There is a tally seed error.",
  501: "The proof is invalid.",

  // Contract/System (600-699)
  600: "Contract is paused.",
  601: "Contract upgrade error.",
  602: "Contract validation error.",
  603: "Collateral error.",
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
