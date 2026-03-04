import { contractErrorMessages } from "../constants/contractErrorMessages";

/** Parses simulation/error message and returns user-facing contract error message. */
export function parseContractError(error: any): string {
  const errorMessage = error.message || error.toString();

  const errorMatch = errorMessage.match(/Error\(Contract, #(\d+)\)/);
  if (errorMatch && errorMatch[1]) {
    const errorCode = parseInt(errorMatch[1]);
    const parsedErrorMessage =
      contractErrorMessages[errorCode as keyof typeof contractErrorMessages];
    if (parsedErrorMessage) {
      return parsedErrorMessage;
    }
    return `Contract error #${errorCode}`;
  }

  const hostErrorMatch = errorMessage.match(
    /HostError: Error\(Contract, #(\d+)\)/,
  );
  if (hostErrorMatch && hostErrorMatch[1]) {
    const errorCode = parseInt(hostErrorMatch[1]);
    const parsedErrorMessage =
      contractErrorMessages[errorCode as keyof typeof contractErrorMessages];
    if (parsedErrorMessage) {
      return parsedErrorMessage;
    }
    return `Contract error #${errorCode}`;
  }

  if (/HostError: Error\(WasmVm,/.test(errorMessage)) {
    const fnMatch = errorMessage.match(
      /topics:\[fn_call,[^,]+,\s*([a-zA-Z0-9_]+)\]/,
    );
    const fnName = fnMatch?.[1];

    if (
      /UnreachableCodeReached|InvalidAction/i.test(errorMessage) ||
      /build_commitments_from_votes/.test(errorMessage)
    ) {
      const where = fnName ? ` in ${fnName}()` : "";
      return `Invalid input for contract execution${where}. For anonymous voting, ensure your key file matches this proposal and try again.`;
    }

    const where = fnName ? ` in ${fnName}()` : "";
    return `Contract VM error${where}. Please retry. If the issue persists, check project configuration.`;
  }

  return errorMessage || "Unknown error during simulation";
}

/** Throws with parsed message if result has simulation.error or result.error. */
export function checkSimulationError(result: any): void {
  if (result?.simulation?.error) {
    throw new Error(parseContractError({ message: result.simulation.error }));
  }
  if (result?.error) {
    throw new Error(parseContractError({ message: result.error }));
  }
}
