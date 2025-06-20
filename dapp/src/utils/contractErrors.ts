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
