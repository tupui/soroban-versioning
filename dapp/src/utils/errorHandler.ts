import {
  contractErrorMessages,
  type ContractErrorMessageKey,
} from "../constants/contractErrorMessages";

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
  errorCode: ContractErrorMessageKey;
  errorMessage: string;
} {
  if (error.code === -4) {
    return {
      errorCode: error.code as ContractErrorMessageKey,
      errorMessage: error.message,
    };
  }

  const errorCodeMatch = /Error\(Contract, #(\d+)\)/.exec(error.message);
  let errorCode: ContractErrorMessageKey = 0;

  if (errorCodeMatch && errorCodeMatch[1]) {
    errorCode = parseInt(errorCodeMatch[1], 10) as ContractErrorMessageKey;
  }

  return {
    errorCode,
    errorMessage: contractErrorMessages[errorCode] || "Unknown contract error",
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
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const _logMessage = `${context}: ${errorMessage}`;
      // No console.error in production
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
