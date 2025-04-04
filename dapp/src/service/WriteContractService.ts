import { kit } from "../components/stellar-wallets-kit";
import Versioning from "../contracts/soroban_versioning";
import { loadedPublicKey } from "./walletService";

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
import * as pkg from "js-sha3";
import type { Vote } from "soroban_versioning";
import type { VoteType } from "types/proposal";
// import type { Response } from "types/response";
import { loadedProjectId } from "./StateService";
const { keccak256 } = pkg;

const server = new rpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);

// Function to map VoteType to Vote
function mapVoteTypeToVote(voteType: VoteType): Vote {
  switch (voteType) {
    case "approved":
      return { tag: "Approve", values: undefined };
    case "rejected":
      return { tag: "Reject", values: undefined };
    case "cancelled":
      return { tag: "Abstain", values: undefined };
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

  Versioning.options.publicKey = publicKey;

  const tx = await Versioning.commit({
    maintainer: publicKey,
    project_key: projectId,
    hash: commit_hash,
  });
  try {
    await tx.signAndSend({
      signTransaction: async (xdr) => {
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e) {
    console.error(e);
    const { errorMessage } = fetchErrorCode(e);
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

  Versioning.options.publicKey = publicKey;

  const maintainers_ = maintainers.split(",");

  const tx = await Versioning.register({
    // @ts-ignore
    name: project_name,
    maintainer: publicKey,
    maintainers: maintainers_,
    url: config_url,
    hash: config_hash,
    domain_contract_id: domain_contract_id,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr) => {
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e) {
    console.error(e);
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
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

  const tx = await Versioning.update_config({
    maintainer: publicKey,
    key: projectId,
    maintainers: maintainers_,
    url: config_url,
    hash: config_hash,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr) => {
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e) {
    console.error(e);
    const { errorMessage } = fetchErrorCode(e);
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
  Versioning.options.publicKey = publicKey;
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  const tx = await Versioning.create_proposal({
    proposer: publicKey,
    project_key: project_key,
    title: title,
    ipfs: ipfs,
    voting_ends_at: BigInt(voting_ends_at),
  });

  try {
    const result = await tx.signAndSend({
      signTransaction: async (xdr) => {
        return await kit.signTransaction(xdr);
      },
    });
    return result.result;
  } catch (e) {
    console.error(e);
    const { errorMessage } = fetchErrorCode(e);
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
  Versioning.options.publicKey = publicKey;
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  const mappedVote = mapVoteTypeToVote(vote);

  const tx = await Versioning.vote({
    voter: publicKey,
    project_key: project_key,
    proposal_id: Number(proposal_id),
    vote: mappedVote,
  });

  try {
    await tx.signAndSend({
      signTransaction: async (xdr) => {
        return await kit.signTransaction(xdr);
      },
    });
    return true;
  } catch (e: any) {
    console.error(e);
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function execute(
  project_name: string,
  proposal_id: number,
): Promise<any> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }
  Versioning.options.publicKey = publicKey;

  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  const tx = await Versioning.execute({
    maintainer: publicKey,
    project_key: project_key,
    proposal_id: Number(proposal_id),
  });

  try {
    const result = await tx.signAndSend({
      signTransaction: async (xdr) => {
        return await kit.signTransaction(xdr);
      },
    });
    return result.result;
  } catch (e) {
    console.error(e);
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function executeProposal(
  project_name: string,
  proposal_id: number,
  executeXdr: string | null,
): Promise<any> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    return {
      data: false,
      error: true,
      errorCode: -1,
      errorMessage: "Please connect your wallet first",
    };
  }

  try {
    await execute(project_name, proposal_id);
    const executorAccount = await server.getAccount(publicKey);
    const outcomeTransactionEnvelope = executeXdr
      ? xdr.TransactionEnvelope.fromXDR(executeXdr, "base64")
      : undefined;

    const outcomeTransaction = outcomeTransactionEnvelope?.v1().tx();

    const transactionBuilder = new TransactionBuilder(executorAccount, {
      fee: import.meta.env.PUBLIC_DEFAULT_FEE,
      networkPassphrase: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    });

    outcomeTransaction?.operations().forEach((operation) => {
      transactionBuilder.addOperation(operation);
    });

    const compositeTransaction = transactionBuilder.setTimeout(180).build();

    const { signedTxXdr } = await kit.signTransaction(
      compositeTransaction.toXDR(),
    );

    const signedTransaction = new Transaction(
      signedTxXdr,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );

    const result = await server.sendTransaction(signedTransaction);

    if (result.status === "ERROR") {
      throw new Error("Transaction failed");
    } else {
      return result.hash;
    }
  } catch (e) {
    console.error(e);
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

export {
  commitHash,
  registerProject,
  updateConfig,
  createProposal,
  voteToProposal,
  executeProposal,
};
