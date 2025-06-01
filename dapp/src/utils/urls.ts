/**
 * URL utility functions
 */

/**
 * Get the Stellar Explorer URL for an address
 */
export const getStellarExplorerURL = (address: string): string => {
  const network = import.meta.env.SOROBAN_NETWORK || "testnet";
  return `https://stellar.expert/explorer/${network}/account/${address}`;
};
