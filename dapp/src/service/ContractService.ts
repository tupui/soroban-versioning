/**
 * Modern Contract Service - Protocol 23 Compatible
 * No backward compatibility - uses latest Stellar SDK patterns only
 */

import { type Badge, type Vote, type VoteChoice } from "../../packages/tansu";
import Tansu from "../contracts/soroban_tansu";
import { loadedPublicKey } from "./walletService";
import { loadedProjectId } from "./StateService";
import { Buffer } from "buffer";
import { deriveProjectKey } from "../utils/projectKey";
import { parseContractError } from "../utils/contractErrors";
import { checkSimulationError } from "../utils/contractErrors";
import { handleFreighterError } from "../utils/errorHandler";
//
import type { VoteType } from "types/proposal";
import { signAndSend } from "./TxService";

/**
 * Get configured contract client instance (using proven working Tansu instance)
 */
function getClient() {
  const publicKey = loadedPublicKey();
  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }

  // Use the proven working Tansu client instance
  Tansu.options.publicKey = publicKey;
  return Tansu;
}

//

/**
 * Universal transaction submitter - handles all contract calls
 * Uses the proven pattern from FlowService
 */
async function submitTransaction(assembledTx: any): Promise<any> {
  // If this is a real assembled transaction (SDK binding), it will expose
  // simulate/prepare/toXDR. Some tests or mocks may pass a plain object
  // (already-executed result); in that case, just return it.
  const hasSimulate = typeof assembledTx?.simulate === "function";
  const hasToXdr = typeof assembledTx?.toXDR === "function";
  if (!hasSimulate && !hasToXdr) {
    return assembledTx?.result ?? assembledTx;
  }

  try {
    return await signAndSend(assembledTx);
  } catch (error: any) {
    // Use enhanced error handling for Freighter-specific issues
    const errorMessage = handleFreighterError(error, "Transaction submission");
    throw new Error(errorMessage);
  }
}

//

/**
 * Map UI vote type to contract vote choice
 */
function mapVoteType(voteType: VoteType): VoteChoice {
  switch (voteType) {
    case "approve":
      return { tag: "Approve", values: void 0 };
    case "reject":
      return { tag: "Reject", values: void 0 };
    case "abstain":
      return { tag: "Abstain", values: void 0 };
    default:
      throw new Error("Invalid vote type");
  }
}

/**
 * Generate project key from name
 */
function getProjectKey(projectName: string): Buffer {
  return deriveProjectKey(projectName);
}

// =============================================================================
// PUBLIC API - All contract interactions
// =============================================================================

/**
 * Commit hash to project
 */
export async function commitHash(commit_hash: string): Promise<boolean> {
  const projectId = loadedProjectId();
  if (!projectId) throw new Error("No project defined");

  const client = getClient();

  // Ensure projectId is a proper Buffer
  const projectKey = Buffer.isBuffer(projectId)
    ? projectId
    : Buffer.from(projectId, "hex");

  const assembledTx = await client.commit({
    maintainer: client.options.publicKey!,
    project_key: projectKey,
    hash: commit_hash,
  });

  // Check for simulation errors (contract errors) before submitting
  checkSimulationError(assembledTx as any);

  await submitTransaction(assembledTx);
  return true;
}

/**
 * Vote on proposal
 */
export async function voteToProposal(
  project_name: string,
  proposal_id: number,
  vote: VoteType,
  customWeight?: number,
): Promise<boolean> {
  const client = getClient();
  const projectKey = getProjectKey(project_name);

  // Get voting weight
  let weight = 1;
  if (customWeight !== undefined) {
    weight = customWeight;
  } else {
    try {
      const weightTx = await client.get_max_weight({
        project_key: projectKey,
        member_address: client.options.publicKey!,
        proposal_id: Number(proposal_id),
      });
      // Check for simulation errors (contract errors)
      checkSimulationError(weightTx as any);
      weight = Number(weightTx.result) || 1;
    } catch {
      // Default weight
    }
  }

  // Check if anonymous voting
  let isPublicVoting = true;
  try {
    const proposalTx = await client.get_proposal({
      project_key: projectKey,
      proposal_id: Number(proposal_id),
    });
    // Check for simulation errors (contract errors)
    checkSimulationError(proposalTx as any);
    isPublicVoting = proposalTx.result.vote_data.public_voting;
  } catch {
    // Default to public
  }

  let votePayload: Vote;

  if (isPublicVoting) {
    votePayload = {
      tag: "PublicVote",
      values: [
        {
          address: client.options.publicKey!,
          vote_choice: mapVoteType(vote),
          weight,
        },
      ],
    };
  } else {
    // Anonymous voting logic
    const voteIndex = vote === "approve" ? 0 : vote === "reject" ? 1 : 2;
    // Important: commitments are built from raw votes/seeds without weights.
    // Weight is applied on-chain when validating/aggregating, so the encoded
    // vote should be 1 for the chosen option and 0 for others to avoid u32
    // overflow in later tallies.
    const votesArr: number[] = [0, 0, 0];
    votesArr[voteIndex] = 1;

    // Generate cryptographically secure 32-bit seeds.
    const r = crypto.getRandomValues(new Uint32Array(3));
    const seedsArr: number[] = [Number(r[0]), Number(r[1]), Number(r[2])];

    // Get anonymous voting config
    const configTx = await client.get_anonymous_voting_config({
      project_key: projectKey,
    });
    // Ensure config actually exists (not an error bubbled in result)
    checkSimulationError(configTx as any);
    const publicKeyStr = configTx.result.public_key;

    // Encrypt votes and seeds using project-configured public key
    const saltPrefix = `${client.options.publicKey}:${project_name}:${proposal_id}`;
    const { encryptWithPublicKey } = await import("../utils/crypto");

    let encryptedSeeds: string[];
    let encryptedVotes: string[];
    let commitmentsTx: any;
    try {
      // Encode votes/seeds as u128 for contract bindings
      const votesU128 = votesArr.map((v) => BigInt(v));
      const seedsU128 = seedsArr.map((s) => BigInt(s));

      [encryptedSeeds, encryptedVotes, commitmentsTx] = await Promise.all([
        Promise.all(
          seedsArr.map((s) =>
            encryptWithPublicKey(`${saltPrefix}:${s}`, publicKeyStr),
          ),
        ),
        Promise.all(
          votesArr.map((v) =>
            encryptWithPublicKey(`${saltPrefix}:${v}`, publicKeyStr),
          ),
        ),
        client.build_commitments_from_votes({
          project_key: projectKey,
          votes: votesU128 as unknown as bigint[],
          seeds: seedsU128 as unknown as bigint[],
        }),
      ]);
      // Ensure the helper call did not surface a simulation error payload
      checkSimulationError(commitmentsTx as any);
    } catch (e: any) {
      // Normalize Wasm VM/host errors to user-friendly text
      throw new Error(parseContractError(e));
    }

    votePayload = {
      tag: "AnonymousVote",
      values: [
        {
          address: client.options.publicKey!,
          weight,
          encrypted_seeds: encryptedSeeds,
          encrypted_votes: encryptedVotes,
          commitments: commitmentsTx.result,
        },
      ],
    };
  }

  const assembledTx = await client.vote({
    voter: client.options.publicKey!,
    project_key: projectKey,
    proposal_id: Number(proposal_id),
    vote: votePayload,
  });

  // Check for simulation errors (contract errors) before submitting
  checkSimulationError(assembledTx as any);

  await submitTransaction(assembledTx);
  return true;
}

/**
 * Execute proposal
 */
export async function execute(
  project_name: string,
  proposal_id: number,
  tallies?: bigint[],
  seeds?: bigint[],
): Promise<any> {
  const client = getClient();
  const projectKey = getProjectKey(project_name);

  const assembledTx = await client.execute({
    maintainer: client.options.publicKey!,
    project_key: projectKey,
    proposal_id: Number(proposal_id),
    tallies,
    seeds,
  });

  // Check for simulation errors (contract errors) before submitting
  checkSimulationError(assembledTx as any);

  return await submitTransaction(assembledTx);
}

// Direct export - no wrapper needed
export { execute as executeProposal };

/**
 * Set badges for member
 */
export async function setBadges(
  member_address: string,
  badges: Badge[],
): Promise<boolean> {
  const projectId = loadedProjectId();
  if (!projectId) throw new Error("No project defined");

  const client = getClient();

  // Ensure projectId is a proper Buffer
  const projectKey = Buffer.isBuffer(projectId)
    ? projectId
    : Buffer.from(projectId, "hex");

  // Rely on contract validation rather than duplicating checks

  // Build transaction using current bindings (key)
  const assembledTx: any = await (client as any).set_badges({
    maintainer: client.options.publicKey!,
    key: projectKey,
    member: member_address,
    badges,
  });

  // Check for simulation errors (contract errors) before submitting
  checkSimulationError(assembledTx as any);

  await submitTransaction(assembledTx);
  return true;
}

/**
 * Setup anonymous voting
 */
export async function setupAnonymousVoting(
  project_name: string,
  public_key: string,
  force = false,
): Promise<boolean> {
  const client = getClient();
  const projectKey = getProjectKey(project_name);

  // Check if already configured
  if (!force) {
    try {
      const configTx = await client.get_anonymous_voting_config({
        project_key: projectKey,
      });
      checkSimulationError(configTx as any);
      if (configTx.result) return true;
    } catch {
      // Fall-through to setup on network/simulation errors
    }
  }

  const assembledTx = await client.anonymous_voting_setup({
    maintainer: client.options.publicKey!,
    project_key: projectKey,
    public_key,
  });

  // Check for simulation errors (contract errors) before submitting
  checkSimulationError(assembledTx as any);

  await submitTransaction(assembledTx);
  return true;
}
