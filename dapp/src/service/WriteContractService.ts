import { kit } from "../components/stellar-wallets-kit";
import { loadedPublicKey } from "./walletService";
import Versioning from "../contracts/soroban_versioning";

import { loadedProjectId } from "./StateService";
import { keccak256 } from "js-sha3";
import type { Vote } from "soroban_versioning";
import type { VoteType } from "types/proposal";
import type { Response } from "types/response";
import {
  contractErrorMessages,
  type ContractErrorMessageKey,
} from "constants/contractErrorMessages";

// Function to map VoteType to Vote
function mapVoteTypeToVote(voteType: VoteType): Vote {
  switch (voteType) {
    case "approve":
      return { tag: "Approve", values: undefined };
    case "reject":
      return { tag: "Reject", values: undefined };
    case "abstain":
      return { tag: "Abstain", values: undefined };
    default:
      throw new Error("Invalid vote type");
  }
}

function fetchErrorCode(error: any): {
  errorCode: ContractErrorMessageKey;
  errorMessage: string;
} {
  const errorCodeMatch = /Error\(Contract, #(\d+)\)/.exec(error.message);
  let errorCode: ContractErrorMessageKey = 0;
  if (errorCodeMatch && errorCodeMatch[1]) {
    errorCode = parseInt(errorCodeMatch[1], 10) as ContractErrorMessageKey;
  }
  return { errorCode, errorMessage: contractErrorMessages[errorCode] };
}

async function commitHash(commit_hash: string): Promise<Response<boolean>> {
  const projectId = loadedProjectId();

  if (!projectId) {
    return {
      data: false,
      error: true,
      errorCode: -1,
      errorMessage: "No project defined",
    };
  }
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    return {
      data: false,
      error: true,
      errorCode: -1,
      errorMessage: "Please connect your wallet first",
    };
  } else {
    Versioning.options.publicKey = publicKey;
  }

  const tx = await Versioning.commit({
    maintainer: publicKey,
    project_key: projectId,
    hash: commit_hash,
  });
  try {
    await tx.signAndSend({
      signTransaction: async (xdr) => {
        const { signedTxXdr } = await kit.signTransaction(xdr);
        return signedTxXdr;
      },
    });
    return { data: true, error: false, errorCode: -1, errorMessage: "" };
  } catch (e) {
    console.error(e);
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: false, error: true, errorCode, errorMessage };
  }
}

async function registerProject(
  project_name: string,
  maintainers: string,
  config_url: string,
  config_hash: string,
  domain_contract_id: string,
): Promise<Response<boolean>> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    return {
      data: false,
      error: true,
      errorCode: -1,
      errorMessage: "Please connect your wallet first",
    };
  } else {
    Versioning.options.publicKey = publicKey;
  }

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
        const { signedTxXdr } = await kit.signTransaction(xdr);
        return signedTxXdr;
      },
    });
    return { data: true, error: false, errorCode: -1, errorMessage: "" };
  } catch (e) {
    console.error(e);
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: false, error: true, errorCode, errorMessage };
  }
}

async function updateConfig(
  maintainers: string,
  config_url: string,
  config_hash: string,
): Promise<Response<boolean>> {
  const projectId = loadedProjectId();

  if (!projectId) {
    return {
      data: false,
      error: true,
      errorCode: -1,
      errorMessage: "No project defined",
    };
  }
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    return {
      data: false,
      error: true,
      errorCode: -1,
      errorMessage: "Please connect your wallet first",
    };
  } else {
    Versioning.options.publicKey = publicKey;
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
        const { signedTxXdr } = await kit.signTransaction(xdr);
        return signedTxXdr;
      },
    });
    return { data: true, error: false, errorCode: -1, errorMessage: "" };
  } catch (e) {
    console.error(e);
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: false, error: true, errorCode, errorMessage };
  }
}

async function createProposal(
  project_name: string,
  title: string,
  ipfs: string,
  voting_ends_at: number,
): Promise<Response<number>> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    return {
      data: -1,
      error: true,
      errorCode: -1,
      errorMessage: "Please connect your wallet first",
    };
  } else {
    Versioning.options.publicKey = publicKey;
  }
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
        const { signedTxXdr } = await kit.signTransaction(xdr);
        return signedTxXdr;
      },
    });
    return {
      data: result.result,
      error: false,
      errorCode: -1,
      errorMessage: "",
    };
  } catch (e) {
    console.error(e);
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: -1, error: true, errorCode, errorMessage };
  }
}

async function voteToProposal(
  project_name: string,
  proposal_id: number,
  vote: VoteType,
): Promise<Response<boolean>> {
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    return {
      data: false,
      error: true,
      errorCode: -1,
      errorMessage: "Please connect your wallet first",
    };
  } else {
    Versioning.options.publicKey = publicKey;
  }
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
        const { signedTxXdr } = await kit.signTransaction(xdr);
        return signedTxXdr;
      },
    });
    return { data: true, error: false, errorCode: -1, errorMessage: "" };
  } catch (e: any) {
    console.error(e);
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return {
      data: false,
      error: true,
      errorCode,
      errorMessage,
    };
  }
}

export {
  commitHash,
  registerProject,
  updateConfig,
  createProposal,
  voteToProposal,
};
