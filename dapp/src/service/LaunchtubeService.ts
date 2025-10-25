/**
 * Launchtube Service - Submit Soroban transactions via Launchtube API
 */

import { retryAsync } from "../utils/retry";

const LAUNCHTUBE_URL =
  import.meta.env.LAUNCHTUBE_URL || "https://testnet.launchtube.xyz";

const USE_LAUNCH_TUBE = import.meta.env.PUBLIC_USE_LAUNCHTUBE || "true";

/**
 * Submit a signed Soroban transaction via Launchtube
 */
export async function sendViaLaunchtube(signedTxXdr: string): Promise<any> {
  try {
    if (!USE_LAUNCH_TUBE) {
      throw new Error("Launchtube is not enabled");
    }

    return await retryAsync(async () => {
      const formData = new URLSearchParams();
      formData.append("xdr", signedTxXdr);

      const res = await fetch(LAUNCHTUBE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.PUBLIC_LAUNCHTUBE_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Launchtube failed: ${errorText}`);
      }

      return res.json();
    });
  } catch (error) {
    console.error("LaunchtubeService error:", error);
    throw error;
  }
}
