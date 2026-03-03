import { parseContractError } from "./contractErrors";

/** Shared error handling; contract messages via parseContractError (contractErrors.ts). */

interface ErrorHandlerOptions {
  showUser?: boolean;
  rethrow?: boolean;
}

/** Returns { errorCode, errorMessage } from contract or -4 user-denial. */
export function extractContractError(error: unknown): {
  errorCode: number;
  errorMessage: string;
} {
  const err = error as { code?: number; message?: string };
  if (err?.code === -4) {
    return {
      errorCode: err.code,
      errorMessage: err.message ?? "Unknown error",
    };
  }

  const errorMessage = parseContractError(
    typeof err?.message === "string" ? { message: err.message } : err,
  );
  const errorCodeMatch = /Error\(Contract, #(\d+)\)/.exec(
    String(err?.message ?? ""),
  );
  const errorCode =
    errorCodeMatch?.[1] != null ? parseInt(errorCodeMatch[1], 10) : 0;

  return {
    errorCode,
    errorMessage,
  };
}

function hasContractError(message: unknown): message is string {
  return typeof message === "string" && message.includes("Error(Contract");
}

export function handleError(
  error: unknown,
  context: string,
  options: ErrorHandlerOptions = {},
): string {
  const { rethrow = false } = options;
  const err = error as { message?: string };

  if (import.meta.env.DEV && err?.message) {
    console.error(
      context,
      hasContractError(err.message)
        ? extractContractError(error).errorMessage
        : err.message,
    );
  }

  const userMessage = hasContractError(err?.message)
    ? extractContractError(error).errorMessage
    : error instanceof Error
      ? error.message
      : String(error ?? "Unknown error");

  if (rethrow) {
    throw new Error(userMessage);
  }

  return userMessage;
}

export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  context: string,
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, { rethrow: true });
    }
  };
}

export function handleSimulationDestructuringError(
  error: unknown,
  context: string,
): string {
  const msg = (error as { message?: string })?.message;
  if (
    typeof msg === "string" &&
    msg.includes("Cannot destructure property 'simulation'")
  ) {
    return `Transaction simulation failed. This usually means:
1. Network connectivity issues - check your internet connection
2. Invalid contract parameters - verify the transaction data
3. Freighter wallet not properly connected - try reconnecting your wallet
4. Contract not deployed or invalid - verify the contract address

Context: ${context}`;
  }

  return msg ?? "Unknown simulation error";
}

export function handleFreighterError(error: unknown, context: string): string {
  const msg = (error as { message?: string })?.message ?? "";

  if (msg.includes("Cannot destructure property 'simulation'")) {
    return handleSimulationDestructuringError(error, context);
  }

  if (msg.includes("Freighter") || msg.includes("wallet")) {
    return `Wallet error: ${msg}. Please:
1. Ensure Freighter is installed and unlocked
2. Check that you're connected to the correct network (Testnet/Mainnet)
3. Try refreshing the page and reconnecting your wallet
4. Verify your account has sufficient XLM for transaction fees`;
  }

  if (msg.includes("fetch") || msg.includes("network")) {
    return `Network error: Unable to connect to Stellar network. Please:
1. Check your internet connection
2. Verify the RPC endpoint is accessible
3. Try again in a few moments`;
  }

  return handleError(error, context);
}
