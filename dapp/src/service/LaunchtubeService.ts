/**
 * Launchtube Service - Submit Soroban transactions via Launchtube API
 */

import { retryAsync } from "../utils/retry";
import { parseContractError } from "../utils/contractErrors";

const LAUNCHTUBE_URL = "https://testnet.launchtube.xyz";

/**
 * Check if Launchtube is enabled and configured
 */
export function isLaunchtubeEnabled(): boolean {
  return (
    import.meta.env.PUBLIC_USE_LAUNCHTUBE === "true" &&
    !!import.meta.env.PUBLIC_LAUNCHTUBE_TOKEN
  );
}

/**
 * Submit a signed Soroban transaction via Launchtube
 */
export async function submitViaLaunchtube(signedTxXdr: string): Promise<any> {
  if (!isLaunchtubeEnabled()) {
    throw new Error("Launchtube is not enabled");
  }

  const response = await retryAsync(async () => {
    const res = await fetch(LAUNCHTUBE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.PUBLIC_LAUNCHTUBE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ xdr: signedTxXdr }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Launchtube failed: ${errorText}`);
    }

    return res.json();
  });

  // Handle contract errors
  if (response.error) {
    const errorStr = JSON.stringify(response.error);
    const contractErrorMatch = errorStr.match(/Error\(Contract, #(\d+)\)/);
    if (contractErrorMatch) {
      throw new Error(parseContractError({ message: errorStr } as any));
    }
    throw new Error(`Transaction failed: ${errorStr}`);
  }

  // Process return value
  if (response.returnValue !== undefined) {
    try {
      if (
        typeof response.returnValue === "number" ||
        typeof response.returnValue === "boolean"
      ) {
        return response.returnValue;
      }

      const { xdr, scValToNative } = await import("@stellar/stellar-sdk");
      let decoded: any;

      if (typeof response.returnValue === "string") {
        const scVal = xdr.ScVal.fromXDR(response.returnValue, "base64");
        decoded = scValToNative(scVal);
      } else {
        decoded = scValToNative(response.returnValue);
      }

      if (typeof decoded === "bigint") return Number(decoded);
      if (typeof decoded === "number") return decoded;
      if (typeof decoded === "boolean") return decoded;

      const coerced = Number(decoded);
      return isNaN(coerced) ? decoded : coerced;
    } catch {
      return true;
    }
  }

  return response;
}
