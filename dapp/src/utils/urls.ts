/**
 * URL utility functions
 */

/**
 * Get the Stellar Explorer URL for an address or transaction
 * @param identifier - The address or transaction hash
 * @param type - The type of identifier ('account' or 'transaction')
 * @returns The Stellar Expert URL
 */
export function getStellarExpertUrl(
  identifier: string,
  type: "account" | "transaction" = "account",
): string {
  const horizonUrl = import.meta.env.PUBLIC_HORIZON_URL;
  const network = horizonUrl.includes("testnet") ? "testnet" : "public";
  const path = type === "transaction" ? "tx" : "account";
  return `https://stellar.expert/explorer/${network}/${path}/${identifier}`;
}
