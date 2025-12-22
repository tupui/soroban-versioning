import {
  getIpfsBasicLink,
  getOutcomeLinkFromIpfs,
  getProposalLinkFromIpfs,
  fetchFromIPFS,
  fetchJSONFromIPFS,
} from "utils/ipfsFunctions";
import type {
  Proposal,
  ProposalOutcome,
  OutcomeContract,
} from "types/proposal";

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
        ...outcomeData.approved,
        contract: approved,
      };
    }
    if (rejected && rejected.address) {
      outcomeData.rejected = {
        ...outcomeData.rejected,
        contract: rejected,
      };
    }
    if (cancelled && cancelled.address) {
      outcomeData.cancelled = {
        ...outcomeData.cancelled,
        contract: cancelled,
      };
    }
  }

  // Return merged data if we have any outcomes
  return Object.keys(outcomeData).length > 0 ? outcomeData : null;
}

/**
 * Converts contract outcomes array to display format
 * Note: This function is now deprecated and merged into fetchProposalOutcomeData
 * which properly merges IPFS descriptions with onchain contract data
 */
function convertContractOutcomesToDisplayFormat(
  contracts: OutcomeContract[],
): ProposalOutcome {
  // Map [approved, rejected, cancelled] contracts to outcome format
  const [approved, rejected, cancelled] = contracts;

  return {
    approved:
      approved && approved.address
        ? {
            description: `Contract execution: ${approved.execute_fn}`,
            contract: approved,
          }
        : undefined,
    rejected:
      rejected && rejected.address
        ? {
            description: `Contract execution: ${rejected.execute_fn}`,
            contract: rejected,
          }
        : undefined,
    cancelled:
      cancelled && cancelled.address
        ? {
            description: `Contract execution: ${cancelled.execute_fn}`,
            contract: cancelled,
          }
        : undefined,
  };
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
