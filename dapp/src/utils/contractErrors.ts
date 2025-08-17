import { ContractErrors } from "../../packages/tansu";

/**
 * Parse contract error from simulation result or error message
 */
export function parseContractError(error: any): string {
  // Check if error has a message
  const errorMessage = error.message || error.toString();

  // Try to extract error code from the error message
  // Format: "Error(Contract, #19)"
  const errorMatch = errorMessage.match(/Error\(Contract, #(\d+)\)/);
  if (errorMatch && errorMatch[1]) {
    const errorCode = parseInt(errorMatch[1]);
    const contractError = (ContractErrors as any)[errorCode];
    if (contractError) {
      return contractError.message;
    }
    return `Contract error #${errorCode}`;
  }

  // Also check for "HostError: Error(Contract, #19)" format
  const hostErrorMatch = errorMessage.match(
    /HostError: Error\(Contract, #(\d+)\)/,
  );
  if (hostErrorMatch && hostErrorMatch[1]) {
    const errorCode = parseInt(hostErrorMatch[1]);
    const contractError = (ContractErrors as any)[errorCode];
    if (contractError) {
      return contractError.message;
    }
    return `Contract error #${errorCode}`;
  }

  // Handle Wasm VM errors with diagnostic topics
  if (/HostError: Error\(WasmVm,/.test(errorMessage)) {
    // Try to extract the function name from diagnostic topics
    const fnMatch = errorMessage.match(
      /topics:\[fn_call,[^,]+,\s*([a-zA-Z0-9_]+)\]/,
    );
    const fnName = fnMatch?.[1];

    // Specific unreachable/invalid action hints
    if (
      /UnreachableCodeReached|InvalidAction/i.test(errorMessage) ||
      /build_commitments_from_votes/.test(errorMessage)
    ) {
      const where = fnName ? ` in ${fnName}()` : "";
      return `Invalid input for contract execution${where}. For anonymous voting, ensure your key file matches this proposal and try again.`;
    }

    // Generic VM error fallback with optional function name
    const where = fnName ? ` in ${fnName}()` : "";
    return `Contract VM error${where}. Please retry. If the issue persists, check project configuration.`;
  }

  // If we can't parse it, return the raw error
  return errorMessage || "Unknown error during simulation";
}

/**
 * Check if an AssembledTransaction result has a simulation error
 */
export function checkSimulationError(result: any): void {
  if (result?.simulation?.error) {
    throw new Error(parseContractError({ message: result.simulation.error }));
  }
  if (result?.error) {
    throw new Error(parseContractError({ message: result.error }));
  }
}
