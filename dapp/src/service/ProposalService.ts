import {
  getIpfsBasicLink,
  fetchTextFromIpfs,
  fetchJsonFromIpfs,
} from "utils/ipfsFunctions";
import type { Proposal, ProposalOutcome } from "types/proposal";

const PROPOSAL_MD_PATH = "/proposal.md";
const OUTCOMES_JSON_PATH = "/outcomes.json";

/**
 * Fetches proposal markdown content from IPFS
 *
 * @param cid - The IPFS CID
 * @returns The markdown content with image paths corrected, or null if not found
 */
async function fetchProposalFromIPFS(cid: string) {
  try {
    const content = await fetchTextFromIpfs(cid, PROPOSAL_MD_PATH);
    if (!content) return null;

    const basicUrl = getIpfsBasicLink(cid);
    if (!basicUrl) return content;

    // Update relative image paths to absolute IPFS paths
    return content.replace(
      /!\[([^\]]*)\]\(([^http][^)]+|[^)]+)\)/g,
      `![$1](${basicUrl}/$2)`,
    );
  } catch {
    return null;
  }
}

/**
 * Fetches proposal outcome data with precedence: contract outcomes take precedence over XDR
 *
 * @param proposal - The proposal object
 * @returns The outcome data (always an object; may be empty so UI can show all three sections)
 */
export async function fetchProposalOutcomeData(
  proposal: Proposal,
): Promise<ProposalOutcome> {
  let outcomeData: ProposalOutcome = {};

  // Load IPFS data first (for descriptions and XDR)
  if (proposal.ipfs) {
    try {
      const ipfsData = await fetchJsonFromIpfs(
        proposal.ipfs,
        OUTCOMES_JSON_PATH,
      );
      if (ipfsData) {
        outcomeData = ipfsData;
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

  // Always return the outcome object so the UI can show all three sections (approved, rejected, cancelled)
  return outcomeData;
}

/**
 * Fetches proposal outcome data from IPFS (legacy function)
 *
 * @param cid - The IPFS CID
 * @returns The outcome JSON data or null if not found
 */
async function fetchOutcomeDataFromIPFS(cid: string) {
  try {
    return await fetchJsonFromIpfs(cid, OUTCOMES_JSON_PATH);
  } catch {
    return null;
  }
}

export { fetchProposalFromIPFS, fetchOutcomeDataFromIPFS };
