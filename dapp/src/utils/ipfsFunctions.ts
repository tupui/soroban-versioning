/**
 * IPFS utility functions for handling IPFS links and resources
 */

/**
 * Formats an IPFS link to use a gateway URL
 * @param ipfsLink - The IPFS CID or link
 * @returns A formatted gateway URL
 */
export const getIpfsBasicLink = (ipfsLink: string): string => {
  // Clean up the input first
  const cleanIpfsLink = ipfsLink.trim();

  // Check if it's already a URL
  if (cleanIpfsLink.startsWith("http")) {
    return cleanIpfsLink;
  }

  // Check if it's a CID (starts with bafy or Qm)
  if (/^(bafy|Qm)/.test(cleanIpfsLink)) {
    // Use w3s.link gateway with proper format
    return `https://${cleanIpfsLink}.ipfs.w3s.link`;
  }

  // If it's something else, return a placeholder
  return `https://ipfs.io/ipfs/${cleanIpfsLink}`;
};

/**
 * Gets the proposal markdown file URL from an IPFS CID
 * @param ipfsLink - The IPFS CID
 * @returns The URL to the proposal markdown file
 */
export const getProposalLinkFromIpfs = (ipfsLink: string): string => {
  return `https://${ipfsLink}.ipfs.w3s.link/proposal.md`;
};

/**
 * Gets the outcomes JSON file URL from an IPFS CID
 * @param ipfsLink - The IPFS CID
 * @returns The URL to the outcomes JSON file
 */
export const getOutcomeLinkFromIpfs = (ipfsLink: string): string => {
  return `https://${ipfsLink}.ipfs.w3s.link/outcomes.json`;
};
