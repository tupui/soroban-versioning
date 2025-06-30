import Tansu from "../contracts/soroban_tansu";
import { loadedPublicKey } from "./walletService";
import { loadedProjectId } from "./StateService";
import type { Badge } from "../../packages/tansu";
import { Buffer } from "buffer";
import * as pkg from "js-sha3";
import { isValidGithubUrl } from "../utils/utils";
import { handleError, extractContractError } from "../utils/errorHandler";
import { validateProjectRegistration } from "../utils/validations";

import {
  rpc,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import {
  contractErrorMessages,
  type ContractErrorMessageKey,
} from "constants/contractErrorMessages";
import type { VoteChoice, Vote } from "../../packages/tansu";
import type { VoteType } from "types/proposal";
import type { Response } from "types/response";

const { keccak256 } = pkg;

const server = new rpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);
const contractId = import.meta.env.PUBLIC_SOROBAN_CONTRACT_ID;

let kitPromise: Promise<any> | null = null;

async function getKit() {
  if (!kitPromise) {
    kitPromise = import("../components/stellar-wallets-kit").then((m) => m.kit);
  }
  return kitPromise;
}

// Function to map VoteType to Vote
function mapVoteTypeToVote(voteType: VoteType): VoteChoice {
  switch (voteType) {
    case "approve":
      return { tag: "Approve" } as VoteChoice;
    case "reject":
      return { tag: "Reject" } as VoteChoice;
    case "abstain":
      return { tag: "Abstain" } as VoteChoice;
    default:
      throw new Error("Invalid vote type");
  }
}

function fetchErrorCode(error: any): {
  errorCode: ContractErrorMessageKey;
  errorMessage: string;
} {
  if (error.code == -4)
    return { errorCode: error.code, errorMessage: error.message };
  const errorCodeMatch = /Error\(Contract, #(\d+)\)/.exec(error.message);
  let errorCode: ContractErrorMessageKey = 0;
  if (errorCodeMatch && errorCodeMatch[1]) {
    errorCode = parseInt(errorCodeMatch[1], 10) as ContractErrorMessageKey;
  }
  return { errorCode, errorMessage: contractErrorMessages[errorCode] };
}

async function commitHash(commit_hash: string): Promise<boolean> {
  const projectId = loadedProjectId();

  if (!projectId) {
    throw new Error("No project defined");
  }
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }

  Tansu.options.publicKey = publicKey;

  try {
    const tx = await Tansu.commit({
      maintainer: publicKey,
      project_key: projectId,
      hash: commit_hash,
    });

    await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

async function registerProject(
  project_name: string,
  maintainers: string,
  config_url: string,
  config_hash: string,
  domain_contract_id: string,
): Promise<boolean> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }

  // Validate all inputs
  const validationErrors = validateProjectRegistration({
    project_name,
    maintainers,
    config_url,
    config_hash,
  });

  // If any validation errors, throw the first one
  const errorKeys = Object.keys(validationErrors);
  if (errorKeys.length > 0) {
    const firstKey = errorKeys[0] as keyof typeof validationErrors;
    throw new Error(validationErrors[firstKey]);
  }

  Tansu.options.publicKey = publicKey;

  // Split maintainers into array and trim each address
  const maintainers_ = maintainers.split(",").map((addr) => addr.trim());

  try {
    const tx = await Tansu.register({
      name: project_name,
      maintainer: publicKey,
      maintainers: maintainers_,
      url: config_url,
      hash: config_hash,
      domain_contract_id: domain_contract_id,
    });

    await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e) {
    const { errorMessage } = extractContractError(e);
    throw new Error(
      errorMessage || "Failed to register project. Please try again.",
    );
  }
}

async function updateConfig(
  maintainers: string,
  config_url: string,
  config_hash: string,
): Promise<boolean> {
  const projectId = loadedProjectId();

  if (!projectId) {
    throw new Error("No project defined");
  }
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }
  const maintainers_ = maintainers.split(",");

  const tx = await Tansu.update_config({
    maintainer: publicKey,
    key: projectId,
    maintainers: maintainers_,
    url: config_url,
    hash: config_hash,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

async function createProposal(
  project_name: string,
  title: string,
  ipfs: string,
  voting_ends_at: number,
): Promise<number> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }
  Tansu.options.publicKey = publicKey;
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  const tx = await Tansu.create_proposal({
    proposer: publicKey,
    project_key: project_key,
    title: title,
    ipfs: ipfs,
    voting_ends_at: BigInt(voting_ends_at),
    public_voting: true,
  });

  try {
    const result = await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return result.result;
  } catch (e) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

async function voteToProposal(
  project_name: string,
  proposal_id: number,
  vote: VoteType,
): Promise<boolean> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }
  Tansu.options.publicKey = publicKey;
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  // Retrieve voting weight for the member
  let weight = 1;
  try {
    const res = await Tansu.get_max_weight({
      project_key,
      member_address: publicKey,
    });
    weight = Number(res.result) || 1;
  } catch (_) {
    // Default to weight 1 if contract query fails
    weight = 1;
  }

  const mappedVote = mapVoteTypeToVote(vote);

  // Determine if the proposal expects public or anonymous voting
  let isPublicVoting = true;
  try {
    const propRes = await Tansu.get_proposal({
      project_key,
      proposal_id: Number(proposal_id),
    });
    isPublicVoting = propRes.result.vote_data.public_voting;
  } catch (_) {
    // fallback to public voting if we cannot fetch proposal
  }

  let votePayload: Vote;

  if (isPublicVoting) {
    votePayload = {
      tag: "PublicVote",
      values: [
        {
          address: publicKey,
          vote_choice: mappedVote,
          weight,
        },
      ],
    } as Vote;
  } else {
    // Anonymous vote flow
    // Build votes & seeds arrays in order [approve, reject, abstain]
    const voteIndex = vote === "approve" ? 0 : vote === "reject" ? 1 : 2;
    const votesArr: number[] = [0, 0, 0];
    // The contract expects the *weighted* vote value (vote * weight) rather than a simple flag.
    // Therefore store `weight` (>=1) for the chosen option, 0 otherwise.
    votesArr[voteIndex] = weight;
    const seedsArr: number[] = [
      Math.floor(Math.random() * 1000000),
      Math.floor(Math.random() * 1000000),
      Math.floor(Math.random() * 1000000),
    ];

    // Fetch anonymous voting config to get public key
    const configRes = await Tansu.get_anonymous_voting_config({
      project_key,
    });
    const publicKeyStr = configRes.result.public_key;

    // Build a salt prefix to bind encrypted values to this member & proposal
    const saltPrefix = `${publicKey}:${project_name}:${proposal_id}`;

    // Encrypt seeds and votes with the salted plaintext
    const { encryptWithPublicKey } = await import("../utils/crypto");

    const encryptedSeeds: string[] = await Promise.all(
      seedsArr.map((s) =>
        encryptWithPublicKey(`${saltPrefix}:${s.toString()}`, publicKeyStr),
      ),
    );
    const encryptedVotes: string[] = await Promise.all(
      votesArr.map((v) =>
        encryptWithPublicKey(`${saltPrefix}:${v.toString()}`, publicKeyStr),
      ),
    );

    // Compute commitments via contract simulation (privacy trade-off acceptable for now)
    const commitmentsRes = await Tansu.build_commitments_from_votes({
      project_key,
      votes: votesArr as unknown as number[],
      seeds: seedsArr as unknown as number[],
    });

    votePayload = {
      tag: "AnonymousVote",
      values: [
        {
          address: publicKey,
          weight,
          encrypted_seeds: encryptedSeeds,
          encrypted_votes: encryptedVotes,
          commitments: commitmentsRes.result,
        },
      ],
    } as Vote;
  }

  const tx = await Tansu.vote({
    voter: publicKey,
    project_key: project_key,
    proposal_id: Number(proposal_id),
    vote: votePayload,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e: any) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

// ──────────────────────────────────────────────────────────────
// Execute a proposal (public OR anonymous)
//
// When the proposal uses anonymous voting the caller **must** pass the
// decoded `tallies` and `seeds` arrays (length 3 each – approve/reject/abstain)
// so that the contract can verify the commitment proof.
//
// For public voting flows those parameters are ignored.
// ──────────────────────────────────────────────────────────────
async function execute(
  project_name: string,
  proposal_id: number,
  tallies?: number[],
  seeds?: number[],
): Promise<any> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }
  Tansu.options.publicKey = publicKey;

  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  try {
    const tx = await Tansu.execute({
      maintainer: publicKey,
      project_key: project_key,
      proposal_id: Number(proposal_id),
      tallies: tallies as unknown as number[] | undefined,
      seeds: seeds as unknown as number[] | undefined,
    });

    const result = await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return result.result;
  } catch (e) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

// High-level helper used by the UI. It delegates to the `execute` helper above
// and keeps the previous signature backward-compatible while allowing
// additional optional arguments for anonymous proposals.
async function executeProposal(
  project_name: string,
  proposal_id: number,
  executeXdr: string | null,
  tallies?: number[],
  seeds?: number[],
): Promise<any> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("No public key found");
  }

  try {
    // Execute the proposal in the smart contract first
    const result = await execute(project_name, proposal_id, tallies, seeds);

    // Only proceed with the outcome transaction if we have an XDR to execute
    if (executeXdr) {
      const executorAccount = await server.getAccount(publicKey);
      const outcomeTransactionEnvelope = xdr.TransactionEnvelope.fromXDR(
        executeXdr,
        "base64",
      );
      const outcomeTransaction = outcomeTransactionEnvelope?.v1().tx();

      const transactionBuilder = new TransactionBuilder(executorAccount, {
        fee: import.meta.env.PUBLIC_DEFAULT_FEE,
        networkPassphrase: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
      });

      outcomeTransaction?.operations().forEach((operation) => {
        transactionBuilder.addOperation(operation);
      });

      const compositeTransaction = transactionBuilder.setTimeout(180).build();

      const kit = await getKit();
      const { signedTxXdr } = await kit.signTransaction(
        compositeTransaction.toXDR(),
      );

      const signedTransaction = new Transaction(
        signedTxXdr,
        import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
      );

      const txResult = await server.sendTransaction(signedTransaction);

      if (txResult.status === "ERROR") {
        throw new Error("Outcome transaction failed");
      }

      return txResult.hash;
    }

    // If no XDR to execute, just return the execution result
    return result.result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

async function addMember(
  member_address: string,
  meta: string,
): Promise<boolean> {
  // Default to loaded public key if member_address empty
  const address = member_address || loadedPublicKey();

  if (!address) {
    throw new Error("Please connect your wallet first");
  }

  Tansu.options.publicKey = address;

  const tx = await Tansu.add_member({
    member_address: address,
    meta: meta,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e: any) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

async function addBadges(
  member_address: string,
  badges: Badge[],
): Promise<boolean> {
  const projectId = loadedProjectId();
  if (!projectId) throw new Error("No project defined");
  const publicKey = loadedPublicKey();
  if (!publicKey) throw new Error("Please connect your wallet first");

  Tansu.options.publicKey = publicKey;

  const tx = await Tansu.add_badges({
    maintainer: publicKey,
    key: projectId,
    member: member_address,
    badges,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e: any) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

async function setupAnonymousVoting(
  project_name: string,
  public_key: string,
  force = false,
): Promise<boolean> {
  const publicKey = loadedPublicKey();
  if (!publicKey) throw new Error("Please connect your wallet first");

  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  Tansu.options.publicKey = publicKey;

  // first check if already configured unless we force an override
  if (!force) {
    try {
      const cfg = await Tansu.get_anonymous_voting_config({ project_key });
      if (cfg.result) return true; // already set, nothing to do
    } catch (_) {
      /* ignore */
    }
  }

  const tx = await Tansu.anonymous_voting_setup({
    project_key,
    public_key,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr: string) => {
        const kit = await getKit();
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e) {
    const { errorMessage } = extractContractError(e);
    throw new Error(errorMessage);
  }
}

async function signTx(xdr: string) {
  const kit = await getKit();
  return kit.signTransaction(xdr);
}

export {
  commitHash,
  registerProject,
  updateConfig,
  createProposal,
  voteToProposal,
  executeProposal,
  addMember,
  addBadges,
  setupAnonymousVoting,
};
