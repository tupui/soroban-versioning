import { contractErrorMessages } from "../constants/contractErrorMessages";

/**
 * Error handling utility for the application
 * Centralizes error handling logic to avoid duplication
 */

interface ErrorHandlerOptions {
  showUser?: boolean; // Whether to show error to user (UI component should handle this)
  rethrow?: boolean; // Whether to rethrow the error after handling
}

/**
 * Extract contract error code and message from error object
 */
export function extractContractError(error: any): {
  errorCode: number;
  errorMessage: string;
} {
  if (error.code === -4) {
    return {
      errorCode: error.code,
      errorMessage: error.message,
    };
  }

  const errorCodeMatch = /Error\(Contract, #(\d+)\)/.exec(error.message);
  let errorCode = 0;

  if (errorCodeMatch && errorCodeMatch[1]) {
    errorCode = parseInt(errorCodeMatch[1], 10);
  }

  // Use our constants file for user-friendly error messages
  const errorMessage =
    contractErrorMessages[errorCode as keyof typeof contractErrorMessages] ||
    `Contract error #${errorCode}`;

  return {
    errorCode,
    errorMessage,
  };
}

/**
 * Handle errors in a consistent way throughout the application
 * @param error The error object
 * @param context Context information about where the error occurred
 * @param options Additional options for error handling
 * @returns The error message
 */
export function handleError(
  error: any,
  context: string,
  options: ErrorHandlerOptions = {},
): string {
  const { showUser: _showUser = true, rethrow = false } = options;

  // For debugging in development only - remove in production
  if (import.meta.env.DEV) {
    // Use more specific error type check
    if (error?.message?.includes("Error(Contract")) {
      const { errorMessage } = extractContractError(error);
      const _logMessage = `${context}: ${errorMessage}`;
      // No console.error in production
      if (import.meta.env.Dev) {
        console.error(_logMessage);
      }
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const _logMessage = `${context}: ${errorMessage}`;
      // No console.error in production
      if (import.meta.env.Dev) {
        console.error(_logMessage);
      }
    }
  }

  // Get appropriate error message
  let userMessage: string;

  if (error?.message?.includes("Error(Contract")) {
    const { errorMessage } = extractContractError(error);
    userMessage = errorMessage;
  } else {
    userMessage = error instanceof Error ? error.message : String(error);
  }

  // Rethrow if needed
  if (rethrow) {
    throw new Error(userMessage);
  }

  return userMessage;
}

/**
 * Create a try-catch wrapper for async functions with consistent error handling
 * @param fn The async function to wrap
 * @param context Context information about the function
 * @returns The wrapped function
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  context: string,
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, { rethrow: true });
      throw error; // TypeScript needs this even though rethrow: true already throws
    }
  };
}

/**
 * Handle the specific "Cannot destructure property 'simulation' of 'e' as it is null" error
 * This error typically occurs when transaction simulation fails due to network or contract issues
 */
export function handleSimulationDestructuringError(
  error: any,
  context: string,
): string {
  // Check if this is the specific destructuring error
  if (
    error?.message?.includes(
      "Cannot destructure property 'simulation' of 'e' as it is null",
    )
  ) {
    return `Transaction simulation failed. This usually means:
1. Network connectivity issues - check your internet connection
2. Invalid contract parameters - verify the transaction data
3. Freighter wallet not properly connected - try reconnecting your wallet
4. Contract not deployed or invalid - verify the contract address

Context: ${context}`;
  }

  return error?.message || "Unknown simulation error";
}

/**
 * Enhanced error handler that specifically addresses Freighter simulation issues
 */
export function handleFreighterError(error: any, context: string): string {
  // Handle the specific destructuring error
  if (error?.message?.includes("Cannot destructure property 'simulation'")) {
    return handleSimulationDestructuringError(error, context);
  }

  // Handle other Freighter-related errors
  if (
    error?.message?.includes("Freighter") ||
    error?.message?.includes("wallet")
  ) {
    return `Wallet error: ${error.message}. Please:
1. Ensure Freighter is installed and unlocked
2. Check that you're connected to the correct network (Testnet/Mainnet)
3. Try refreshing the page and reconnecting your wallet
4. Verify your account has sufficient XLM for transaction fees`;
  }

  // Handle network connectivity errors
  if (
    error?.message?.includes("fetch") ||
    error?.message?.includes("network")
  ) {
    return `Network error: Unable to connect to Stellar network. Please:
1. Check your internet connection
2. Verify the RPC endpoint is accessible
3. Try again in a few moments`;
  }

  // Default error handling
  return handleError(error, context);
}
