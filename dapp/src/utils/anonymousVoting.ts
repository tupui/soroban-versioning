// Utility helpers to handle Soroban Tansu anonymous voting flows
// Centralizes and deduplicates logic that was previously embedded in several UI components.
//
// All heavy lifting (fetching proposal, decrypting votes, computing tallies/seeds and optional proof)
// is done in this single module so UI components can remain lean.

import { deriveProjectKey } from "./projectKey";
import type { VoteStatus } from "types/proposal";
import { VoteType } from "types/proposal";
import { decryptWithPrivateKey } from "utils/crypto";
import { Badge } from "../../packages/tansu/dist";
// Lazy-loaded imports to avoid circular dependency issues in Astro/SSR
async function getTansu() {
  const mod = await import("../contracts/soroban_tansu");
  return mod.default;
}

// Helper to derive the project_key (32-byte buffer)
// re-export local helper for consistency
export { deriveProjectKey };

/**
 * Validate that an uploaded key-file (optionally containing a publicKey)
 * matches the project's anonymous voting configuration. Throws a helpful
 * error if the project's config is missing or the key mismatches.
 */
export async function validateAnonymousKeyForProject(
  projectName: string,
  uploadedPublicKey?: string,
): Promise<void> {
  const Tansu = await getTansu();
  const project_key = deriveProjectKey(projectName);
  try {
    const { result: cfg } = await Tansu.get_anonymous_voting_config({
      project_key,
    });
    if (uploadedPublicKey && uploadedPublicKey !== cfg.public_key) {
      throw new Error(
        "Key file does not match this project's anonymous voting key",
      );
    }
  } catch (e: any) {
    if (e?.message?.includes("NoAnonymousVotingConfig")) {
      throw new Error("Anonymous voting is not configured for this project");
    }
    // Swallow transient/network errors here so callers can proceed to decryption
  }
}

export interface DecodedVote {
  address: string;
  vote: "approve" | "reject" | "abstain";
  seed: number;
  weight: number;
  maxWeight: number | string;
}

export interface AnonymousVotingData {
  tallies: bigint[]; // length 3: approve/reject/abstain – weighted
  seeds: bigint[]; // length 3 – sum of seeds per choice
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

  // Extract proposer address
  const proposerAddr: string = rawProposal?.proposer ?? "";

  // Init accumulators
  const talliesArr = [0, 0, 0];
  const seedsArr = [0, 0, 0];
  const voteCounts = [0, 0, 0];
  const decodedPerVoter: DecodedVote[] = [];

  for (const vote of votes) {
    if (!vote || vote.tag !== "AnonymousVote") continue;
    const data: any = vote.values?.[0];
    if (!data) continue;

    const encryptedVotes: string[] =
      (data as { encrypted_votes?: string[] }).encrypted_votes ?? [];
    const encryptedSeeds: string[] =
      (data as { encrypted_seeds?: string[] }).encrypted_seeds ?? [];

    let voteChoiceIdx = -1;
    let selectedSeedRaw = 0;
    // Retrieve max weight for voter
    const memberAddr = (data as { address?: string }).address ?? "";

    let weight: number;
    let maxWeight: number | string;

    if (memberAddr === proposerAddr) {
      weight = Badge.Verified;
      maxWeight = "N/A"; //For proposer
    } else {
      // Normal voter – use weight from contract
      weight = Number((data as { weight?: number }).weight ?? Badge.Default);
      maxWeight = Badge.Default;
      try {
        const maxRes = await Tansu.get_max_weight({
          project_key,
          member_address: memberAddr,
        });
        if (maxRes && typeof maxRes === "object" && "result" in maxRes) {
          maxWeight = Number(maxRes.result) || Badge.Default;
        }
      } catch (_) {
        /* ignore – default Badge.Default */
      }
    }

    // Process each choice
    for (let i = 0; i < 3; i++) {
      if (i >= encryptedVotes.length || i >= encryptedSeeds.length) continue;
      const vCipher = encryptedVotes[i];
      const sCipher = encryptedSeeds[i];
      if (!vCipher || !sCipher) continue;

      // Decrypt (or parse plain numbers for default votes)
      const vDec = isPlainNumber(vCipher)
        ? parseInt(vCipher)
        : parseInt(
            (await decryptWithPrivateKey(vCipher, privateKey))
              .split(":")
              .pop()!,
          );
      const sDec = isPlainNumber(sCipher)
        ? parseInt(sCipher)
        : parseInt(
            (await decryptWithPrivateKey(sCipher, privateKey))
              .split(":")
              .pop()!,
          );

      if (vDec > 0) voteChoiceIdx = i;
      if (vDec > 0) selectedSeedRaw = sDec; // capture per-voter unweighted seed for display

      // Apply voting weight to both vote value and seed
      talliesArr[i]! += vDec * weight;
      seedsArr[i]! += sDec * weight;
      if (vDec > 0) voteCounts[i]! += 1;
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
        tallies: talliesArr.map((n) => BigInt(n)),
        seeds: seedsArr.map((n) => BigInt(n)),
      });
      proofOk = !!proofRes.result;
    } catch (_) {
      proofOk = false;
    }
  }

  return {
    tallies: talliesArr.map((n) => BigInt(n)),
    seeds: seedsArr.map((n) => BigInt(n)),
    voteCounts,
    voteStatus,
    decodedVotes: decodedPerVoter,
    proofOk,
  };
}
