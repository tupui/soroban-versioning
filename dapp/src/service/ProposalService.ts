import {
  getIpfsBasicLink,
  getOutcomeLinkFromIpfs,
  getProposalLinkFromIpfs,
  fetchFromIPFS,
  fetchJSONFromIPFS,
} from "utils/ipfsFunctions";

/**
 * Fetches proposal markdown content from IPFS
 *
 * @param url - The IPFS CID
 * @returns The markdown content with image paths corrected, or null if not found
 */
async function fetchProposalFromIPFS(url: string) {
  // Validate CID format
  const validCidPattern = /^(bafy|Qm)[a-zA-Z0-9]{44,}$/;
  if (!url || !validCidPattern.test(url)) {
    return null;
  }

  try {
    const proposalUrl = getProposalLinkFromIpfs(url);
    if (!proposalUrl) {
      return null;
    }

    const response = await fetchFromIPFS(proposalUrl);
    if (!response.ok) {
      return null;
    }

    const content = await response.text();
    const basicUrl = getIpfsBasicLink(url);

    // Update relative image paths to absolute IPFS paths
    const updatedContent = content.replace(
      /!\[([^\]]*)\]\(([^http][^)]+|[^)]+)\)/g,
      `![$1](${basicUrl}/$2)`,
    );

    return updatedContent;
  } catch {
    return null;
  }
}

/**
 * Fetches proposal outcome data from IPFS
 *
 * @param url - The IPFS CID
 * @returns The outcome JSON data or null if not found
 */
async function fetchOutcomeDataFromIPFS(url: string) {
  // Validate CID format
  const validCidPattern = /^(bafy|Qm)[a-zA-Z0-9]{44,}$/;
  if (!url || !validCidPattern.test(url)) {
    return null;
  }

  try {
    const outcomeUrl = getOutcomeLinkFromIpfs(url);
    if (!outcomeUrl) {
      return null;
    }

    return await fetchJSONFromIPFS(outcomeUrl);
  } catch {
    return null;
  }
}

export { fetchProposalFromIPFS, fetchOutcomeDataFromIPFS };
