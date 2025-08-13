// Utility helpers to handle Soroban Tansu anonymous voting flows
// Centralizes and deduplicates logic that was previously embedded in several UI components.
//
// All heavy lifting (fetching proposal, decrypting votes, computing tallies/seeds and optional proof)
// is done in this single module so UI components can remain lean.

import { Buffer } from "buffer";
import { deriveProjectKey } from "./projectKey";
import type { VoteStatus } from "types/proposal";
import { VoteType } from "types/proposal";
import { decryptWithPrivateKey } from "utils/crypto";

// Lazy-loaded imports to avoid circular dependency issues in Astro/SSR
async function getTansu() {
  const mod = await import("../contracts/soroban_tansu");
  return mod.default;
}

// Helper to derive the project_key (32-byte buffer)
// re-export local helper for consistency
export { deriveProjectKey };

export interface DecodedVote {
  address: string;
  vote: "approve" | "reject" | "abstain";
  seed: number;
  weight: number;
  maxWeight: number;
}

export interface AnonymousVotingData {
  tallies: number[]; // length 3: approve/reject/abstain – weighted
  seeds: number[]; // length 3 – sum of seeds per choice
  voteCounts: number[]; // length 3 – un-weighted counts (needed for proof)
  voteStatus: VoteStatus;
  decodedVotes: DecodedVote[];
  proofOk?: boolean | null; // undefined if verifyProof == false
}

// Regex helper reused across components
const isPlainNumber = (s: string | undefined) => !!s && /^\d+$/.test(s);

/**
 * Compute anonymous voting tallies (and optionally verify the commitment proof).
 *
 * The heuristic reproduced here was duplicated across several UI components.
 * Consolidating it provides a single source of truth and eases maintenance.
 */
export async function computeAnonymousVotingData(
  projectName: string,
  proposalId: number,
  privateKey: string,
  verifyProof = false,
): Promise<AnonymousVotingData> {
  const Tansu = await getTansu();
  const project_key = deriveProjectKey(projectName);

  // Fetch proposal with votes
  const { result: rawProposal } = await Tansu.get_proposal({
    project_key,
    proposal_id: Number(proposalId),
  });
  const votes: any[] = rawProposal?.vote_data?.votes ?? [];

  // Init accumulators
  const talliesArr = [0, 0, 0];
  const seedsArr = [0, 0, 0];
  const voteCounts = [0, 0, 0];
  const decodedPerVoter: DecodedVote[] = [];

  for (const vote of votes) {
    if (!vote || vote.tag !== "AnonymousVote") continue;
    const data: any = vote.values?.[0];
    if (!data) continue;

    const weight: number = Number((data as { weight?: number }).weight ?? 1);
    const encryptedVotes: string[] =
      (data as { encrypted_votes?: string[] }).encrypted_votes ?? [];
    const encryptedSeeds: string[] =
      (data as { encrypted_seeds?: string[] }).encrypted_seeds ?? [];

    let voteChoiceIdx = -1;
    let selectedSeedRaw = 0;
    for (let i = 0; i < 3; i++) {
      if (i >= encryptedVotes.length || i >= encryptedSeeds.length) continue;
      const vCipher = encryptedVotes[i] as string | undefined;
      const sCipher = encryptedSeeds[i] as string | undefined;
      if (!vCipher || !sCipher) continue;

      // Decrypt (or parse plain numbers for default votes)
      let vDec: number;
      if (isPlainNumber(vCipher)) {
        vDec = parseInt(vCipher);
      } else {
        const decStr = await decryptWithPrivateKey(vCipher!, privateKey);
        const numStr = decStr.includes(":") ? decStr.split(":").pop()! : decStr;
        vDec = parseInt(numStr);
      }
      let sDec: number;
      if (isPlainNumber(sCipher)) {
        sDec = parseInt(sCipher);
      } else {
        const decStr = await decryptWithPrivateKey(sCipher!, privateKey);
        const numStr = decStr.includes(":") ? decStr.split(":").pop()! : decStr;
        sDec = parseInt(numStr);
      }

      if (vDec > 0) {
        voteChoiceIdx = i;
        selectedSeedRaw = sDec; // capture per-voter unweighted seed for display
      }
      // Apply voting weight to both vote value and seed
      talliesArr[i] += vDec * weight;
      seedsArr[i] += sDec * weight;
      if (vDec > 0) {
        voteCounts[i] += 1;
      }
    }

    // Retrieve max weight for voter
    const memberAddr = (data as { address?: string }).address ?? "";
    let maxWeight = 1;
    try {
      const maxRes = await Tansu.get_max_weight({
        project_key,
        member_address: memberAddr,
      });
      maxWeight = Number((maxRes as any).result) || 1;
    } catch (_) {
      /* ignore – default 1 */
    }

    decodedPerVoter.push({
      address: memberAddr,
      vote:
        voteChoiceIdx === 0
          ? "approve"
          : voteChoiceIdx === 1
            ? "reject"
            : "abstain",
      // Show the voter's own seed (unweighted) to avoid confusion with
      // aggregated, weighted seed tallies used for on-chain proof
      seed: selectedSeedRaw,
      weight,
      maxWeight,
    });
  }

  if (decodedPerVoter.length === 0) {
    throw new Error("Key file does not match any encrypted votes");
  }

  // Build VoteStatus object used by UI components
  const voteStatus: VoteStatus = {
    approve: {
      voteType: VoteType.APPROVE,
      score: Number(talliesArr[0]),
      voters: [],
    },
    reject: {
      voteType: VoteType.REJECT,
      score: Number(talliesArr[1]),
      voters: [],
    },
    abstain: {
      voteType: VoteType.CANCEL,
      score: Number(talliesArr[2]),
      voters: [],
    },
  };

  let proofOk: boolean | null = null;
  if (verifyProof) {
    try {
      const proofRes = await Tansu.proof({
        project_key,
        proposal: rawProposal,
        tallies: talliesArr as unknown as number[],
        seeds: seedsArr as unknown as number[],
      });
      proofOk = !!proofRes.result;
    } catch (_) {
      proofOk = false;
    }
  }

  return {
    tallies: talliesArr,
    seeds: seedsArr,
    voteCounts,
    voteStatus,
    decodedVotes: decodedPerVoter,
    proofOk,
  };
}
