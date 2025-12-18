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
  // Priority 1: Check for outcome_contracts on-chain (takes precedence)
  if (proposal.outcome_contracts && proposal.outcome_contracts.length > 0) {
    return convertContractOutcomesToDisplayFormat(proposal.outcome_contracts);
  }

  // Priority 2: Fall back to XDR from IPFS
  if (proposal.ipfs) {
    const outcomeUrl = getOutcomeLinkFromIpfs(proposal.ipfs);
    if (outcomeUrl) {
      return await fetchJSONFromIPFS(outcomeUrl);
    }
  }

  return null;
}

/**
 * Converts contract outcomes array to display format
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
