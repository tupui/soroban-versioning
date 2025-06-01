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
  try {
    const proposalUrl = getProposalLinkFromIpfs(url);
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
  } catch (error) {
    console.error("Error fetching proposal content:", error);
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
  try {
    const outcomeUrl = getOutcomeLinkFromIpfs(url);
    return await fetchJSONFromIPFS(outcomeUrl);
  } catch (error) {
    console.error("Error fetching outcome data:", error);
    return null;
  }
}

export { fetchProposalFromIPFS, fetchOutcomeDataFromIPFS };
