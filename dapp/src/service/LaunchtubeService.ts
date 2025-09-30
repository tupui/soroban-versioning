/**
 * Launchtube Service - Submit Soroban transactions via Launchtube API
 */

import { retryAsync } from "../utils/retry";

const LAUNCHTUBE_URL = import.meta.env.LAUNCHTUBE_URL || "https://testnet.launchtube.xyz";

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
export async function sendViaLaunchtube(signedTxXdr: string): Promise<any> {
  if (!isLaunchtubeEnabled()) {
    throw new Error("Launchtube is not enabled");
  }

  return retryAsync(async () => {
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
}
