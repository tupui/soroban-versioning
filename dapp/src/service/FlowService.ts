import { calculateDirectoryCid } from "../utils/ipfsFunctions";
import { create } from "@web3-storage/w3up-client";
import { extract } from "@web3-storage/w3up-client/delegation";
import { kit } from "../components/stellar-wallets-kit";
import Tansu from "../contracts/soroban_tansu";
import { loadedPublicKey } from "./walletService";
import * as pkg from "js-sha3";
import { parseContractError } from "utils/contractErrors";
const { keccak256 } = pkg;

interface UploadWithDelegationParams {
  files: File[];
  type: "proposal" | "member";
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
    const data = await response.json();
    throw new Error(data.error);
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
  const project_key = Buffer.from(
    keccak256.create().update(projectName).digest(),
  );

  const tx = await Tansu.create_proposal({
    proposer: publicKey,
    project_key: project_key,
    title: title,
    ipfs: ipfs,
    voting_ends_at: BigInt(votingEndsAt),
    public_voting: publicVoting,
  });

  let sim;
  try {
    sim = await tx.simulate();
  } catch (error: any) {
    throw new Error(parseContractError(error));
  }

  if ((tx as any).prepare) {
    await (tx as any).prepare(sim);
  }

  const preparedXdr = tx.toXDR();

  // Sign the transaction
  const { signedTxXdr } = await kit.signTransaction(preparedXdr);
  return signedTxXdr;
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

  Tansu.options.publicKey = address;

  const tx = await Tansu.add_member({
    member_address: address,
    meta: meta,
  });

  // Simulate the transaction to prepare it with Soroban data
  try {
    await tx.simulate();
  } catch (error: any) {
    // If simulation fails, parse and throw a user-friendly error
    throw new Error(parseContractError(error));
  }

  // Get the transaction XDR after simulation
  const preparedXdr = tx.toXDR();

  // Sign the transaction
  const { signedTxXdr } = await kit.signTransaction(preparedXdr);
  return signedTxXdr;
}

/**
 * Send a signed transaction to the network
 */
async function sendSignedTransaction(signedTxXdr: string): Promise<any> {
  const { Transaction, rpc } = await import("@stellar/stellar-sdk");
  const server = new rpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL);

  // The JS SDK Transaction class can only parse classic envelopes; Soroban
  // contract transactions include additional SorobanTransactionData and may
  // therefore be rejected as MALFORMED when re-encoded. The Soroban RPC
  // server happily accepts a base64-encoded envelope string though, so we
  // short-circuit and post the raw XDR if we already have it signed.

  let sendResponse;
  try {
    // Cast to any because typings accept only Transaction, but Soroban RPC
    // supports base64 envelope; the runtime call is valid.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendResponse = await (server as any).sendTransaction(signedTxXdr);
  } catch (_) {
    // Fallback to legacy path for classic txs
    const transaction = new Transaction(
      signedTxXdr,
      import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
    );
    sendResponse = await server.sendTransaction(transaction);
  }

  if (sendResponse.status === "ERROR") {
    // Try to parse contract error from the response
    const errorResultStr = JSON.stringify(sendResponse.errorResult);
    const contractErrorMatch = errorResultStr.match(
      /Error\(Contract, #(\d+)\)/,
    );
    if (contractErrorMatch) {
      throw new Error(parseContractError({ message: errorResultStr }));
    }
    throw new Error(`Transaction failed: ${errorResultStr}`);
  }

  // For successful transactions, we need to wait for confirmation
  if (sendResponse.status === "PENDING") {
    // Wait for transaction confirmation
    let getResponse = await server.getTransaction(sendResponse.hash);
    let retries = 0;
    const maxRetries = 30;

    while (getResponse.status === "NOT_FOUND" && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(sendResponse.hash);
      retries++;
    }

    if (getResponse.status === "SUCCESS") {
      // Extract the result from the transaction meta
      if (getResponse.returnValue) {
        try {
          // Lazy-load decoder utilities from stellar-sdk
          const { xdr, scValToNative } = await import("@stellar/stellar-sdk");

          let decoded: any;
          if (typeof getResponse.returnValue === "string") {
            // Base64-encoded XDR string
            const scVal = xdr.ScVal.fromXDR(getResponse.returnValue, "base64");
            decoded = scValToNative(scVal);
          } else {
            // Already a ScVal object
            decoded = scValToNative(getResponse.returnValue);
          }

          // For the create_proposal call we expect an integer ID
          if (typeof decoded === "bigint") return Number(decoded);
          if (typeof decoded === "number") return decoded;

          // If the contract returns a boolean (other flows) just pass it through
          if (typeof decoded === "boolean") return decoded;

          // Fallback: attempt numeric coercion
          const coerced = Number(decoded);
          return isNaN(coerced) ? decoded : coerced;
        } catch (_) {
          // On any failure, indicate generic success so the outer flow can continue
          return true;
        }
      }
      return true;
    } else if (getResponse.status === "FAILED") {
      // Try to extract contract error from failed transaction
      const resultStr = JSON.stringify(getResponse);
      const contractErrorMatch = resultStr.match(/Error\(Contract, #(\d+)\)/);
      if (contractErrorMatch) {
        throw new Error(parseContractError({ message: resultStr }));
      }
      throw new Error(`Transaction failed with status: ${getResponse.status}`);
    } else {
      throw new Error(`Transaction failed with status: ${getResponse.status}`);
    }
  }

  return sendResponse;
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
  onProgress?.(7); // Signing step
  const signedTxXdr = await createSignedProposalTransaction(
    projectName,
    proposalName,
    expectedCid,
    votingEndsAt,
    publicVoting,
  );

  // Step 3: Upload to IPFS using the signed transaction as authentication
  onProgress?.(8); // Uploading step
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
  onProgress?.(9); // Sending step
  const result = await sendSignedTransaction(signedTxXdr);

  // The result should be the proposal ID
  return typeof result === "number" ? result : parseInt(result.toString());
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
  let cid = " "; // Default for no profile

  if (profileFiles.length > 0) {
    // Step 1: Calculate the CID
    cid = await calculateDirectoryCid(profileFiles);
  }

  // Create the W3UP client to get the DID
  const client = await create();
  const did = client.agent.did();

  // Step 2: Create and sign the smart contract transaction with the CID
  const signedTxXdr = await createSignedAddMemberTransaction(
    memberAddress,
    cid,
  );

  if (profileFiles.length > 0) {
    // Step 3: Upload to IPFS using the signed transaction as authentication
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
  }

  // Step 5: Send the signed transaction
  await sendSignedTransaction(signedTxXdr);
  return true;
}
