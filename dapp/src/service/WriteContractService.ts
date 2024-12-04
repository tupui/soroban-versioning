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

async function commitHash(commit_hash: string): Promise<boolean> {
  const projectId = loadedProjectId();

  if (!projectId) {
    alert("No project defined");
    return false;
  }
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    alert("Please connect your wallet first");
    return false;
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
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
    alert("Please connect your wallet first");
    return false;
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
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function updateConfig(
  maintainers: string,
  config_url: string,
  config_hash: string,
): Promise<boolean> {
  const projectId = loadedProjectId();

  if (!projectId) {
    alert("No project defined");
    return false;
  }
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    alert("Please connect your wallet first");
    return false;
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
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
    alert("Please connect your wallet first");
    return -1;
  } else {
    Versioning.options.publicKey = publicKey;
  }
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );
  try {
    const tx = await Versioning.create_proposal({
      proposer: publicKey,
      project_key: project_key,
      title: title,
      ipfs: ipfs,
      voting_ends_at: BigInt(voting_ends_at),
    });

    const result = await tx.signAndSend({
      signTransaction: async (xdr) => {
        const { signedTxXdr } = await kit.signTransaction(xdr);
        return signedTxXdr;
      },
    });
    return result.result;
  } catch (e) {
    console.error(e);
    return -1;
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
    return { data: true, error: false, errorMessage: "" };
  } catch (e: any) {
    const errorCodeMatch = /Error\(Contract, #(\d+)\)/.exec(e.message);
    let errorCode: ContractErrorMessageKey = 0;
    if (errorCodeMatch && errorCodeMatch[1]) {
      errorCode = parseInt(errorCodeMatch[1], 10) as ContractErrorMessageKey;
    }

    return {
      data: false,
      error: true,
      errorMessage: contractErrorMessages[errorCode],
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
