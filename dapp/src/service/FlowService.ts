import { calculateDirectoryCid } from "../utils/ipfsFunctions";
import { create } from "@storacha/client";
import * as Delegation from "@ucanto/core/delegation";
import type { OutcomeContract } from "../types/proposal";
import Tansu from "../contracts/soroban_tansu";
import { loadedPublicKey } from "./walletService";
import { loadedProjectId } from "./StateService";
import { deriveProjectKey } from "../utils/projectKey";
import { sendSignedTransaction, signAssembledTransaction } from "./TxService";
import { checkSimulationError } from "../utils/contractErrors";
import { Buffer } from "buffer";

interface UploadWithDelegationParams {
  files: File[];
  signedTxXdr: string;
  did: string;
}

interface CreateProposalFlowParams {
  projectName: string;
  proposalName: string;
  proposalFiles: File[];
  votingEndsAt: number;
  publicVoting?: boolean;
  outcomeContracts?: OutcomeContract[];
  tokenContract?: string;
  onProgress?: (step: number) => void;
}

interface JoinCommunityFlowParams {
  memberAddress: string;
  profileFiles: File[];
  onProgress?: (step: number) => void;
  git_identity?: string;
  git_pubkey?: Buffer;
  msg?: Buffer;
  sig?: Buffer;
}

interface CreateProjectFlowParams {
  projectName: string;
  tomlFile: File;
  githubRepoUrl: string;
  maintainers: string[];
  onProgress?: (step: number) => void;
}

export async function uploadWithDelegation({
  files,
  signedTxXdr,
  did,
}: UploadWithDelegationParams): Promise<string> {
  const response = await fetch(import.meta.env.PUBLIC_DELEGATION_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTxXdr, did }),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let errorMessage = "Unknown error";
    try {
      if (contentType?.includes("application/json")) {
        errorMessage = (await response.json()).error || errorMessage;
      } else {
        errorMessage = (await response.text()) || errorMessage;
      }
    } catch (parseError) {
      console.error("Failed to parse error response:", parseError);
    }
    throw new Error(errorMessage);
  }

  const delegationArchive = await response.arrayBuffer();
  const uint8 = new Uint8Array(delegationArchive);
  const extracted = await Delegation.extract(uint8);

  let delegation;
  if ("ok" in extracted) {
    delegation = extracted.ok;
  } else if (Array.isArray(extracted)) {
    [delegation] = extracted;
  }

  if (!delegation) {
    throw new Error("Failed to extract a valid delegation from archive");
  }

  const client = await create();
  const space = await client.addSpace(delegation);
  await client.setCurrentSpace(space.did());

  const directoryCid = await client.uploadDirectory(files);
  if (!directoryCid) throw new Error("Failed to upload to IPFS");

  return directoryCid.toString();
}

async function createSignedProposalTransaction(
  projectName: string,
  title: string,
  ipfs: string,
  votingEndsAt: number,
  publicVoting: boolean,
  outcomeContracts?: OutcomeContract[],
  tokenContract?: string,
): Promise<string> {
  const publicKey = loadedPublicKey();
  if (!publicKey) throw new Error("Please connect your wallet first");

  Tansu.options.publicKey = publicKey;
  const project_key = deriveProjectKey(projectName);
  const outcomesContractAddress = outcomeContracts?.[0]?.address;

  const tx = await Tansu.create_proposal({
    proposer: publicKey,
    project_key,
    title,
    ipfs,
    voting_ends_at: BigInt(votingEndsAt),
    public_voting: publicVoting,
    outcomes_contract: outcomesContractAddress,
    token_contract: tokenContract,
  });

  checkSimulationError(tx as any);
  return signAssembledTransaction(tx);
}

async function createSignedAddMemberTransaction(
  memberAddress: string,
  meta: string,
  git_identity?: string,
  git_pubkey?: Buffer,
  msg?: Buffer,
  sig?: Buffer,
): Promise<string> {
  const address = memberAddress || loadedPublicKey();
  if (!address) throw new Error("Please connect your wallet first");

  if (meta.trim() === "") {
    meta = "";
  }

  Tansu.options.publicKey = address;

  const tx = await Tansu.add_member({
    member_address: address,
    meta,
    git_identity,
    git_pubkey,
    msg,
    sig,
  });

  checkSimulationError(tx as any);
  return signAssembledTransaction(tx);
}

async function sendSignedTransactionLocal(signedTxXdr: string): Promise<any> {
  return sendSignedTransaction(signedTxXdr);
}

export async function createProposalFlow({
  projectName,
  proposalName,
  proposalFiles,
  votingEndsAt,
  publicVoting = true,
  outcomeContracts,
  tokenContract,
  onProgress,
}: CreateProposalFlowParams): Promise<number> {
  const expectedCid = await calculateDirectoryCid(proposalFiles);
  const client = await create();
  const did = client.agent.did();

  onProgress?.(7);
  const signedTxXdr = await createSignedProposalTransaction(
    projectName,
    proposalName,
    expectedCid,
    votingEndsAt,
    publicVoting,
    outcomeContracts,
    tokenContract,
  );

  onProgress?.(8);
  const uploadedCid = await uploadWithDelegation({
    files: proposalFiles,
    signedTxXdr,
    did,
  });

  if (uploadedCid !== expectedCid) {
    throw new Error(`CID mismatch: expected ${expectedCid}, got ${uploadedCid}`);
  }

  onProgress?.(9);
  const result = await sendSignedTransactionLocal(signedTxXdr);

  const parsed = Number(result);
  if (!Number.isNaN(parsed)) return parsed;
  throw new Error("Unexpected contract response: missing proposal id");
}

export async function joinCommunityFlow({
  memberAddress,
  profileFiles,
  onProgress,
  git_identity,
  git_pubkey,
  msg,
  sig,
}: JoinCommunityFlowParams): Promise<boolean> {
  let cid = "";
  if (profileFiles.length > 0) {
    cid = await calculateDirectoryCid(profileFiles);
  }

  const client = await create();
  const did = client.agent.did();

  onProgress?.(7);
  const signedTxXdr = await createSignedAddMemberTransaction(
    memberAddress,
    cid,
    git_identity,
    git_pubkey,
    msg,
    sig,
  );

  if (profileFiles.length > 0) {
    onProgress?.(8);
    try {
      const uploadedCid = await uploadWithDelegation({
        files: profileFiles,
        signedTxXdr,
        did,
      });
      if (uploadedCid !== cid) {
        throw new Error(`CID mismatch: expected ${cid}, got ${uploadedCid}`);
      }
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw error;
    }
  }

  onProgress?.(9);
  await sendSignedTransactionLocal(signedTxXdr);
  return true;
}

export async function createProjectFlow({
  projectName,
  tomlFile,
  githubRepoUrl,
  maintainers,
  onProgress,
}: CreateProjectFlowParams): Promise<boolean> {
  const expectedCid = await calculateDirectoryCid([tomlFile]);
  const client = await create();
  const did = client.agent.did();

  onProgress?.(7);

  const publicKey = loadedPublicKey();
  if (!publicKey) throw new Error("Please connect your wallet first");

  Tansu.options.publicKey = publicKey;

  const tx = await Tansu.register({
    maintainer: publicKey,
    name: projectName,
    maintainers,
    url: githubRepoUrl,
    ipfs: expectedCid,
  });

  checkSimulationError(tx as any);
  const signedTxXdr = await signAssembledTransaction(tx);

  onProgress?.(8);
  const cidUploaded = await uploadWithDelegation({
    files: [tomlFile],
    signedTxXdr,
    did,
  });

  if (cidUploaded !== expectedCid) {
    throw new Error(`CID mismatch: expected ${expectedCid}, got ${cidUploaded}`);
  }

  onProgress?.(9);
  await sendSignedTransactionLocal(signedTxXdr);
  return true;
}

async function createSignedUpdateConfigTransaction(
  maintainers: string[],
  configUrl: string,
  cid: string,
): Promise<string> {
  const publicKey = loadedPublicKey();
  if (!publicKey) throw new Error("Please connect your wallet first");

  Tansu.options.publicKey = publicKey;

  const projectId = loadedProjectId();
  if (!projectId) throw new Error("No project defined");

  const projectKey = Buffer.isBuffer(projectId)
    ? projectId
    : Buffer.from(projectId, "hex");

  const tx = await Tansu.update_config({
    maintainer: publicKey,
    key: projectKey,
    maintainers,
    url: configUrl,
    ipfs: cid,
  });

  checkSimulationError(tx as any);
  return signAssembledTransaction(tx);
}

export async function updateConfigFlow({
  tomlFile,
  githubRepoUrl,
  maintainers,
  onProgress,
}: {
  tomlFile: File;
  githubRepoUrl: string;
  maintainers: string[];
  onProgress?: (step: number) => void;
}): Promise<boolean> {
  const expectedCid = await calculateDirectoryCid([tomlFile]);
  const client = await create();
  const did = client.agent.did();

  onProgress?.(7);
  const signedTxXdr = await createSignedUpdateConfigTransaction(
    maintainers,
    githubRepoUrl,
    expectedCid,
  );

  onProgress?.(8);
  const cidUploaded = await uploadWithDelegation({
    files: [tomlFile],
    signedTxXdr,
    did,
  });

  if (cidUploaded !== expectedCid) {
    throw new Error(`CID mismatch: expected ${expectedCid}, got ${cidUploaded}`);
  }

  onProgress?.(9);
  await sendSignedTransaction(signedTxXdr);
  return true;
}
