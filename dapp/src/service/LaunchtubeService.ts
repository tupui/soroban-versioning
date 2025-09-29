/**
 * Launchtube Service - Submit Soroban transactions via Launchtube API
 * 
 * Launchtube handles transaction fees, sequence numbers, retries, and network submission
 * for Soroban operations, eliminating the need for XLM or managing transaction complexity.
 */

import { retryAsync } from "../utils/retry";
import { parseContractError } from "../utils/contractErrors";
import { toast } from "utils/utils";
import { launchtubeConfig } from "../utils/env";

/**
 * Check if Launchtube is enabled and configured
 */
export function isLaunchtubeEnabled(): boolean {
  return launchtubeConfig.enabled && !!launchtubeConfig.token;
}

/**
 * Get remaining credits for the current Launchtube token
 */
export async function getLaunchtubeCredits(): Promise<number> {
  if (!isLaunchtubeEnabled()) {
    throw new Error("Launchtube is not enabled or configured");
  }

  const token = launchtubeConfig.token;
  
  try {
    const response = await fetch(`${launchtubeConfig.baseUrl}/info`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get credits: ${response.status} ${response.statusText}`);
    }

    const credits = await response.text();
    return parseInt(credits, 10);
  } catch (error: any) {
    console.error("Failed to get Launchtube credits:", error);
    throw new Error(`Launchtube credits check failed: ${error.message}`);
  }
}

/**
 * Submit a signed Soroban transaction via Launchtube
 * 
 * @param signedTxXdr - Base64 encoded signed transaction XDR
 * @returns Transaction result from Launchtube
 */
export async function submitViaLaunchtube(signedTxXdr: string): Promise<any> {
  if (!isLaunchtubeEnabled()) {
    throw new Error("Launchtube is not enabled or configured");
  }

  const token = launchtubeConfig.token;

  try {
    const response = await retryAsync(async () => {
      const res = await fetch(launchtubeConfig.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xdr: signedTxXdr,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage: string;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorText;
        } catch {
          errorMessage = errorText;
        }

        // Handle specific Launchtube errors
        if (res.status === 401) {
          throw new Error("Invalid Launchtube token");
        } else if (res.status === 402) {
          throw new Error("Insufficient Launchtube credits");
        } else if (res.status === 429) {
          throw new Error("Rate limit exceeded");
        }

        throw new Error(`Launchtube submission failed: ${errorMessage}`);
      }

      return res.json();
    });

    // Handle Launchtube response format
    if (response.error) {
      // Check for contract errors in Launchtube response
      const errorStr = JSON.stringify(response.error);
      const contractErrorMatch = errorStr.match(/Error\(Contract, #(\d+)\)/);
      if (contractErrorMatch) {
        throw new Error(parseContractError({ message: errorStr } as any));
      }
      throw new Error(`Transaction failed: ${errorStr}`);
    }

    // Process successful response
    if (response.returnValue !== undefined) {
      try {
        // Handle different return value formats
        if (typeof response.returnValue === "number" || typeof response.returnValue === "boolean") {
          return response.returnValue;
        }

        // Decode XDR return values
        const { xdr, scValToNative } = await import("@stellar/stellar-sdk");
        let decoded: any;
        
        if (typeof response.returnValue === "string") {
          const scVal = xdr.ScVal.fromXDR(response.returnValue, "base64");
          decoded = scValToNative(scVal);
        } else {
          decoded = scValToNative(response.returnValue);
        }

        // Normalize return values
        if (typeof decoded === "bigint") return Number(decoded);
        if (typeof decoded === "number") return decoded;
        if (typeof decoded === "boolean") return decoded;
        
        const coerced = Number(decoded);
        return isNaN(coerced) ? decoded : coerced;
      } catch (decodeError) {
        console.warn("Failed to decode return value:", decodeError);
        return true;
      }
    }

    return response;
  } catch (error: any) {
    console.error("Launchtube submission error:", error);
    
    // Provide user-friendly error messages
    if (error.message.includes("Invalid Launchtube token")) {
      toast.error("Configuration Error", "Invalid Launchtube token. Please check your configuration.");
    } else if (error.message.includes("Insufficient Launchtube credits")) {
      toast.error("Insufficient Credits", "Not enough Launchtube credits to submit transaction.");
    } else if (error.message.includes("Rate limit exceeded")) {
      toast.error("Rate Limited", "Too many requests. Please try again later.");
    }
    
    throw error;
  }
}

/**
 * Check Launchtube service health and token validity
 */
export async function checkLaunchtubeHealth(): Promise<{
  isHealthy: boolean;
  credits?: number;
  error?: string;
}> {
  if (!isLaunchtubeEnabled()) {
    return {
      isHealthy: false,
      error: "Launchtube is not enabled or configured"
    };
  }

  try {
    const credits = await getLaunchtubeCredits();
    return {
      isHealthy: true,
      credits
    };
  } catch (error: any) {
    return {
      isHealthy: false,
      error: error.message
    };
  }
}