/**
 * Modern Contract Service - Protocol 23 Compatible
 * No backward compatibility - uses latest Stellar SDK patterns only
 */

import { type Badge, type Vote, type VoteChoice } from "../../packages/tansu";
import Tansu from "../contracts/soroban_tansu";
import { loadedPublicKey } from "./walletService";
import { loadedProjectId } from "./StateService";
import { Buffer } from "buffer";
import * as pkg from "js-sha3";
import { parseContractError } from "../utils/contractErrors";
import { retryAsync } from "../utils/retry";
import type { VoteType } from "types/proposal";

const { keccak256 } = pkg;

let kitPromise: Promise<any> | null = null;

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

/**
 * Get Stellar Wallets Kit
 */
async function getKit() {
  if (!kitPromise) {
    kitPromise = import("../components/stellar-wallets-kit").then((m) => m.kit);
  }
  return kitPromise;
}

/**
 * Universal transaction submitter - handles all contract calls
 * Uses the proven pattern from FlowService
 */
async function submitTransaction(assembledTx: any): Promise<any> {
  try {
    // Step 1: Simulate the transaction
    let sim;
    try {
      sim = await assembledTx.simulate();
    } catch (error: any) {
      throw new Error(parseContractError(error));
    }

    // Step 2: Prepare the transaction (if supported)
    if ((assembledTx as any).prepare) {
      await (assembledTx as any).prepare(sim);
    }

    // Step 3: Get XDR and sign
    const preparedXdr = assembledTx.toXDR();
    const kit = await getKit();
    const { signedTxXdr } = await kit.signTransaction(preparedXdr);

    // Step 4: Send the signed transaction
    const result = await sendSignedTransaction(signedTxXdr);
    return result;
  } catch (error: any) {
    if (error.message?.includes("Error(Contract")) {
      throw new Error(parseContractError(error));
    }
    throw new Error(`Transaction failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Send a signed transaction to the network (from FlowService)
 */
async function sendSignedTransaction(signedTxXdr: string): Promise<any> {
  const { Transaction, rpc } = await import("@stellar/stellar-sdk");
  const server = new rpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);

  let sendResponse;
  try {
    // Use the proven FlowService pattern - direct XDR submission with retry
    sendResponse = await retryAsync(() =>
      (server as any).sendTransaction(signedTxXdr),
    );
  } catch (_) {
    // Fallback to legacy path for classic txs
    const transaction = new Transaction(
      signedTxXdr,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );
    sendResponse = await retryAsync(() => server.sendTransaction(transaction));
  }

  if (sendResponse.status === "ERROR") {
    throw new Error(
      `Transaction failed: ${JSON.stringify(sendResponse.errorResult)}`,
    );
  }

  // For successful transactions, we need to wait for confirmation
  if (sendResponse.status === "PENDING") {
    let getResponse = await server.getTransaction(sendResponse.hash);
    let retries = 0;
    const maxRetries = 30;

    while (getResponse.status === "NOT_FOUND" && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(sendResponse.hash);
      retries++;
    }

    if (getResponse.status === "SUCCESS") {
      return true; // Success
    } else if (getResponse.status === "FAILED") {
      throw new Error(`Transaction failed: ${getResponse.status}`);
    }
  }

  return sendResponse;
}

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
  return Buffer.from(keccak256.create().update(projectName).digest());
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
  const assembledTx = await client.commit({
    maintainer: client.options.publicKey!,
    project_key: projectId,
    hash: commit_hash,
  });

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
): Promise<boolean> {
  const client = getClient();
  const projectKey = getProjectKey(project_name);

  // Get voting weight
  let weight = 1;
  try {
    const weightTx = await client.get_max_weight({
      project_key: projectKey,
      member_address: client.options.publicKey!,
    });
    weight = Number(weightTx.result) || 1;
  } catch {
    // Default weight
  }

  // Check if anonymous voting
  let isPublicVoting = true;
  try {
    const proposalTx = await client.get_proposal({
      project_key: projectKey,
      proposal_id: Number(proposal_id),
    });
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
    const votesArr: number[] = [0, 0, 0];
    votesArr[voteIndex] = weight;

    const seedsArr: number[] = [
      (crypto.getRandomValues(new Uint32Array(1))[0] || 0) % 1000000,
      (crypto.getRandomValues(new Uint32Array(1))[0] || 0) % 1000000,
      (crypto.getRandomValues(new Uint32Array(1))[0] || 0) % 1000000,
    ];

    // Get anonymous voting config
    const configTx = await client.get_anonymous_voting_config({
      project_key: projectKey,
    });
    const publicKeyStr = configTx.result.public_key;

    // Encrypt votes and seeds
    const saltPrefix = `${client.options.publicKey}:${project_name}:${proposal_id}`;
    const { encryptWithPublicKey } = await import("../utils/crypto");

    const [encryptedSeeds, encryptedVotes, commitmentsTx] = await Promise.all([
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
        votes: votesArr as unknown as number[],
        seeds: seedsArr as unknown as number[],
      }),
    ]);

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

  await submitTransaction(assembledTx);
  return true;
}

/**
 * Execute proposal
 */
export async function execute(
  project_name: string,
  proposal_id: number,
  tallies?: number[],
  seeds?: number[],
): Promise<any> {
  const client = getClient();
  const projectKey = getProjectKey(project_name);

  const assembledTx = await client.execute({
    maintainer: client.options.publicKey!,
    project_key: projectKey,
    proposal_id: Number(proposal_id),
    tallies: tallies as unknown as number[] | undefined,
    seeds: seeds as unknown as number[] | undefined,
  });

  return await submitTransaction(assembledTx);
}

/**
 * Execute proposal (wrapper)
 */
export async function executeProposal(
  project_name: string,
  proposal_id: number,
  tallies?: number[],
  seeds?: number[],
): Promise<any> {
  return execute(project_name, proposal_id, tallies, seeds);
}

/**
 * Add badges to member
 */
export async function addBadges(
  member_address: string,
  badges: Badge[],
): Promise<boolean> {
  const projectId = loadedProjectId();
  if (!projectId) throw new Error("No project defined");

  const client = getClient();
  const assembledTx = await client.add_badges({
    maintainer: client.options.publicKey!,
    key: projectId,
    member: member_address,
    badges,
  });

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
      if (configTx.result) return true;
    } catch {
      // Continue with setup
    }
  }

  const assembledTx = await client.anonymous_voting_setup({
    project_key: projectKey,
    public_key,
  });

  await submitTransaction(assembledTx);
  return true;
}
