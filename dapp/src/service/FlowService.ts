import { calculateDirectoryCid } from "../utils/ipfsFunctions";
import { create } from "@web3-storage/w3up-client";
import { extract } from "@web3-storage/w3up-client/delegation";
//
import Tansu from "../contracts/soroban_tansu";
import { loadedPublicKey } from "./walletService";
import { loadedProjectId } from "./StateService";
import { deriveProjectKey } from "../utils/projectKey";
//

//
import { sendSignedTransaction, signAssembledTransaction } from "./TxService";
import { checkSimulationError } from "../utils/contractErrors";

interface UploadWithDelegationParams {
  files: File[];
  type: "proposal" | "member" | "project";
  projectName?: string;
  signedTxXdr: string; // The signed contract transaction
  did: string;
}

interface CreateProposalFlowParams {
  projectName: string;
  proposalName: string;
  proposalFiles: File[];
  votingEndsAt: number;
  publicVoting?: boolean;
  onProgress?: (step: number) => void;
}

interface JoinCommunityFlowParams {
  memberAddress: string;
  profileFiles: File[];
  onProgress?: (step: number) => void;
}

interface CreateProjectFlowParams {
  projectName: string;
  tomlFile: File;
  githubRepoUrl: string;
  maintainers: string[];
  onProgress?: (step: number) => void;
}

/**
 * Upload files to IPFS using delegation
 */
async function uploadWithDelegation({
  files,
  type,
  projectName,
  signedTxXdr,
  did,
}: UploadWithDelegationParams): Promise<string> {
  const apiUrl = `/api/w3up-delegation`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTxXdr, did, type, projectName }),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");

    let errorMessage = "Unknown error";
    try {
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
    } catch (parseError) {
      console.error("Failed to parse error response:", parseError);
    }

    throw new Error(errorMessage);
  }

  const data = await response.arrayBuffer();

  const delegation = await extract(new Uint8Array(data));
  if (!delegation.ok) {
    throw new Error("Failed to extract delegation", {
      cause: delegation.error,
    });
  }

  const client = await create();
  const space = await client.addSpace(delegation.ok);
  await client.setCurrentSpace(space.did());

  const directoryCid = await client.uploadDirectory(files);
  if (!directoryCid) throw new Error("Failed to upload to IPFS");

  return directoryCid.toString();
}

/**
 * Create and sign a proposal transaction
 */
async function createSignedProposalTransaction(
  projectName: string,
  title: string,
  ipfs: string,
  votingEndsAt: number,
  publicVoting: boolean,
): Promise<string> {
  const publicKey = loadedPublicKey();
  if (!publicKey) throw new Error("Please connect your wallet first");

  Tansu.options.publicKey = publicKey;
  const project_key = deriveProjectKey(projectName);

  const tx = await Tansu.create_proposal({
    proposer: publicKey,
    project_key: project_key,
    title: title,
    ipfs: ipfs,
    voting_ends_at: BigInt(votingEndsAt),
    public_voting: publicVoting,
    outcomes_contract: undefined,
  });

  // Check for simulation errors (contract errors) before signing
  checkSimulationError(tx as any);

  return await signAssembledTransaction(tx);
}

/**
 * Create and sign an add member transaction
 */
async function createSignedAddMemberTransaction(
  memberAddress: string,
  meta: string,
): Promise<string> {
  const address = memberAddress || loadedPublicKey();
  if (!address) throw new Error("Please connect your wallet first");

  // Validate meta parameter - ensure it's not just whitespace
  if (meta.trim() === "") {
    meta = ""; // Use empty string instead of whitespace
  }

  Tansu.options.publicKey = address;

  const tx = await Tansu.add_member({
    member_address: address,
    meta: meta,
  });

  // Check for simulation errors (contract errors) before signing
  checkSimulationError(tx as any);

  return await signAssembledTransaction(tx);
}

/**
 * Send a signed transaction to the network
 */
async function sendSignedTransactionLocal(signedTxXdr: string): Promise<any> {
  return sendSignedTransaction(signedTxXdr);
}

/**
 * Execute the new Flow 2 for creating a proposal
 *
 * This flow reduces user interactions from 2 signatures to 1:
 * 1. Calculate CID locally before any user interaction
 * 2. Create and sign the proposal transaction with the pre-calculated CID
 * 3. Upload to IPFS using the signed transaction for authentication
 * 4. Verify the uploaded CID matches the calculated one
 * 5. Send the pre-signed transaction to the network
 *
 * @param params - The proposal creation parameters
 * @returns The created proposal ID
 * @throws Error if any step fails
 */
export async function createProposalFlow({
  projectName,
  proposalName,
  proposalFiles,
  votingEndsAt,
  publicVoting = true,
  onProgress,
}: CreateProposalFlowParams): Promise<number> {
  // Step 1: Calculate the CID
  const expectedCid = await calculateDirectoryCid(proposalFiles);

  // Create the W3UP client to get the DID
  const client = await create();
  const did = client.agent.did();

  // Step 2: Create and sign the smart contract transaction with the CID
  onProgress?.(7); // Signing proposal transaction (UI index 2)
  const signedTxXdr = await createSignedProposalTransaction(
    projectName,
    proposalName,
    expectedCid,
    votingEndsAt,
    publicVoting,
  );

  // Step 3: Upload to IPFS using the signed transaction as authentication
  onProgress?.(8); // Uploading to IPFS (UI index 3)
  const uploadedCid = await uploadWithDelegation({
    files: proposalFiles,
    type: "proposal",
    projectName,
    signedTxXdr,
    did,
  });

  // Step 4: Verify CID matches
  if (uploadedCid !== expectedCid) {
    throw new Error(
      `CID mismatch: expected ${expectedCid}, got ${uploadedCid}`,
    );
  }

  // Step 5: Send the signed transaction
  onProgress?.(9); // Sending transaction (align with ProgressStep step 4)
  const result = await sendSignedTransactionLocal(signedTxXdr);

  // The result should be the proposal ID
  if (typeof result === "number") return result;
  const parsed = Number(result);
  if (!Number.isNaN(parsed)) return parsed;
  throw new Error("Unexpected contract response: missing proposal id");
}

/**
 * Execute the new Flow 2 for joining the community
 *
 * This flow reduces user interactions from 2 signatures to 1:
 * 1. If profile data is provided, calculate CID locally
 * 2. Create and sign the add_member transaction with the CID (or empty)
 * 3. If profile data exists, upload to IPFS and verify CID
 * 4. Send the pre-signed transaction to the network
 *
 * @param params - The member registration parameters
 * @returns true if successful
 * @throws Error if any step fails
 */
export async function joinCommunityFlow({
  memberAddress,
  profileFiles,
  onProgress,
}: JoinCommunityFlowParams): Promise<boolean> {
  let cid = ""; // Default for no profile - use empty string instead of single space

  if (profileFiles.length > 0) {
    // Step 1: Calculate the CID
    cid = await calculateDirectoryCid(profileFiles);
  }

  // Create the W3UP client to get the DID
  const client = await create();
  const did = client.agent.did();

  // Step 2: Create and sign the smart contract transaction with the CID
  onProgress?.(7); // signing step indicator (offset -5 → shows Sign)
  const signedTxXdr = await createSignedAddMemberTransaction(
    memberAddress,
    cid,
  );

  if (profileFiles.length > 0) {
    // Step 3: Upload to IPFS using the signed transaction as authentication
    onProgress?.(8); // uploading step indicator (offset -5 → shows Uploading)
    try {
      const uploadedCid = await uploadWithDelegation({
        files: profileFiles,
        type: "member",
        signedTxXdr,
        did,
      });

      // Step 4: Verify CID matches
      if (uploadedCid !== cid) {
        throw new Error(`CID mismatch: expected ${cid}, got ${uploadedCid}`);
      }
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw error;
    }
  }

  // Step 5: Send the signed transaction
  onProgress?.(9); // sending step indicator (offset -5 → shows Sending)
  await sendSignedTransactionLocal(signedTxXdr);
  return true;
}

/**
 * Execute Flow 2 for creating a project – mirrors proposal flow steps:
 * 1. Calculate CID locally
 * 2. Create & sign register transaction embedding CID
 * 3. Upload to IPFS using the signed tx for delegation
 * 4. Verify CID matches
 * 5. Send signed transaction
 */
export async function createProjectFlow({
  projectName,
  tomlFile,
  githubRepoUrl,
  maintainers,
  onProgress,
}: CreateProjectFlowParams): Promise<boolean> {
  // Step 1 – Calculate CID
  const expectedCid = await calculateDirectoryCid([tomlFile]);

  // Create W3UP client for DID retrieval
  const client = await create();
  const did = client.agent.did();

  // Step 2 – Create & sign register transaction
  onProgress?.(7); // signing step indicator (offset -4 → shows Sign)

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

  // Check for simulation errors (contract errors) before signing
  checkSimulationError(tx as any);

  const signedTxXdr = await signAssembledTransaction(tx);

  // Step 3 – Upload to IPFS with delegation
  onProgress?.(8); // uploading step indicator (offset -4 → shows Uploading)

  const cidUploaded = await uploadWithDelegation({
    files: [tomlFile],
    type: "project",
    signedTxXdr,
    did,
  });

  // Step 4 – Verify CID matches
  if (cidUploaded !== expectedCid) {
    throw new Error(
      `CID mismatch: expected ${expectedCid}, got ${cidUploaded}`,
    );
  }

  // Step 5 – Send signed transaction
  onProgress?.(9); // sending step indicator (offset -4 → shows Sending)
  await sendSignedTransactionLocal(signedTxXdr);

  return true;
}

/** Create and sign an update_config transaction */
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

  // Ensure projectId is a proper Buffer
  const projectKey = Buffer.isBuffer(projectId)
    ? projectId
    : Buffer.from(projectId, "hex");

  const tx = await Tansu.update_config({
    maintainer: publicKey,
    key: projectKey,
    maintainers: maintainers,
    url: configUrl,
    ipfs: cid,
  });

  // Check for simulation errors (contract errors) before signing
  checkSimulationError(tx as any);

  return await signAssembledTransaction(tx);
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

  // sign tx
  onProgress?.(7); // UI offset -4 → shows "Sign"
  const signedTxXdr = await createSignedUpdateConfigTransaction(
    maintainers,
    githubRepoUrl,
    expectedCid,
  );

  // upload
  onProgress?.(8); // UI offset -4 → shows "Uploading"
  const cidUploaded = await uploadWithDelegation({
    files: [tomlFile],
    type: "project",
    signedTxXdr,
    did,
  });

  if (cidUploaded !== expectedCid) {
    throw new Error(
      `CID mismatch: expected ${expectedCid}, got ${cidUploaded}`,
    );
  }

  onProgress?.(9); // UI offset -4 → shows "Sending"
  await sendSignedTransaction(signedTxXdr);
  return true;
}
