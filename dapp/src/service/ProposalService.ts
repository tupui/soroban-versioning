import {
  getIpfsBasicLink,
  getOutcomeLinkFromIpfs,
  getProposalLinkFromIpfs,
  fetchFromIPFS,
  fetchJSONFromIPFS,
} from "utils/ipfsFunctions";
import type { Proposal, ProposalOutcome } from "types/proposal";

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
 * Fetches proposal outcome data with precedence: contract outcomes take precedence over XDR
 *
 * @param proposal - The proposal object
 * @returns The outcome data or null if not found
 */
export async function fetchProposalOutcomeData(
  proposal: Proposal,
): Promise<ProposalOutcome | null> {
  let outcomeData: ProposalOutcome = {};

  // Load IPFS data first (for descriptions and XDR)
  if (proposal.ipfs) {
    try {
      const outcomeUrl = getOutcomeLinkFromIpfs(proposal.ipfs);
      if (outcomeUrl) {
        const ipfsData = await fetchJSONFromIPFS(outcomeUrl);
        if (ipfsData) {
          outcomeData = ipfsData;
        }
      }
    } catch (error) {
      console.warn("Failed to load IPFS outcome data:", error);
    }
  }

  // Merge with onchain contract data
  if (proposal.outcome_contracts && proposal.outcome_contracts.length > 0) {
    const [approved, rejected, cancelled] = proposal.outcome_contracts;

    if (approved && approved.address) {
      outcomeData.approved = {
        description:
          outcomeData.approved?.description ??
          `Contract execution: ${approved.execute_fn}`,
        ...outcomeData.approved,
        contract: approved,
      };
    }
    if (rejected && rejected.address) {
      outcomeData.rejected = {
        description:
          outcomeData.rejected?.description ??
          `Contract execution: ${rejected.execute_fn}`,
        ...outcomeData.rejected,
        contract: rejected,
      };
    }
    if (cancelled && cancelled.address) {
      outcomeData.cancelled = {
        description:
          outcomeData.cancelled?.description ??
          `Contract execution: ${cancelled.execute_fn}`,
        ...outcomeData.cancelled,
        contract: cancelled,
      };
    }
  }

  // Return merged data if we have any outcomes
  return Object.keys(outcomeData).length > 0 ? outcomeData : null;
}

/**
 * Fetches proposal outcome data from IPFS (legacy function)
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
