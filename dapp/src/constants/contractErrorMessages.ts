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
  100: "You are not authorized to perform this action.",
  101: "You are an invalid voter.",
  102: "The maintainer is not the domain owner.",
  200: "The provided key is invalid.",
  201: "The project already exists.",
  202: "There was a validation issue with the proposal input.",
  203: "The member does not exist. Please ensure the member address is correct and the member has been registered.",
  204: "The member already exists.",
  205: "There is an invalid domain error.",
  206: "The voting type is wrong.",
  207: "Bad commitment.",
  208: "Invalid voter weight calculation.",
  209: "Too many voters already.",
  300: "No hash was found.",
  301: "Proposal or page could not be found.",
  302: "Project page could not be found.",
  303: "Anonymous voting is not configured for this project.",
  400: "You have already voted.",
  401: "Voting is not allowed at this time.",
  402: "The proposal is no longer active.",
  403: "There was an error processing the proposal outcome.",
  500: "There is a tally seed error.",
  501: "The proof is invalid.",
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
