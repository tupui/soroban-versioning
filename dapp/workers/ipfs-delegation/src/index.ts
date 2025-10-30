/**
 * Cloudflare Worker for IPFS Delegation
 *
 * This worker handles Storacha delegation requests for IPFS uploads.
 * It validates transactions and generates delegation proofs.
 *
 * SECURITY: Uses Cloudflare secrets for sensitive credentials.
 */

import { Transaction, Keypair, Networks } from "@stellar/stellar-sdk";
import { create } from "@storacha/client";
import { Signer } from "@storacha/client/principal/ed25519";
import * as Proof from "@storacha/client/proof";
import { StoreMemory } from "@storacha/client/stores/memory";
import * as DID from "@ipld/dag-ucan/did";

export interface Env {
  // Cloudflare secrets
  STORACHA_SING_PRIVATE_KEY: string;
  STORACHA_PROOF: string;
}

interface DelegationRequest {
  did: string;
  signedTxXdr: string;
}

const ALLOWED_ORIGINS = [
  "http://localhost:4321",
  "https://testnet.tansu.dev",
  "https://app.tansu.dev",
  "https://tansu.xlm.sh",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const corsHeaders = getCorsHeaders(origin);

    // Handle OPTIONS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      const body = (await request.json()) as DelegationRequest;
      const { signedTxXdr, did } = body;

      // Validate required fields
      if (!signedTxXdr || !did) {
        throw new Error("Missing required fields: signedTxXdr and did");
      }

      // Validate the request (only signature matters)
      await validateRequest(signedTxXdr);

      // Generate the delegation
      const archive = await generateDelegation(did, env);

      return new Response(archive, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/octet-stream",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    } catch (err: any) {
      console.error("Error creating delegation:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.message.includes("not found") ? 404 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  },
};

/**
 * Validates the request - verifies the transaction is cryptographically signed by its source
 * Automatically tries both testnet and mainnet passphrases
 */
async function validateRequest(signedTxXdr: string): Promise<void> {
  const passphrases = [Networks.TESTNET, Networks.PUBLIC];
  let tx: Transaction | null = null;

  for (const passphrase of passphrases) {
    try {
      tx = new Transaction(signedTxXdr, passphrase);
      break; // Successfully parsed transaction
    } catch {
      continue; // Try next passphrase
    }
  }

  if (!tx) {
    throw new Error("Failed to parse transaction XDR");
  }

  // Verify transaction is signed
  if (!tx.signatures || tx.signatures.length === 0) {
    throw new Error("Transaction must be signed");
  }

  // Verify transaction has operations
  if (!tx.operations || tx.operations.length === 0) {
    throw new Error("Transaction must have at least one operation");
  }

  // Verify source account is set
  if (!tx.source) {
    throw new Error("Transaction must have a source account");
  }

  // Cryptographically verify the signature belongs to the source account
  const txHash = tx.hash();
  const sourceKeypair = Keypair.fromPublicKey(tx.source);

  for (const signature of tx.signatures) {
    if (sourceKeypair.verify(txHash, signature.signature())) {
      return; // Success
    }
  }

  throw new Error("Transaction signature is invalid for the source account");
}

/**
 * Generates a delegation archive for the given DID
 */
async function generateDelegation(did: string, env: Env): Promise<Uint8Array> {
  // Validate environment variables first
  const key = env.STORACHA_SING_PRIVATE_KEY;
  let storachaProof = env.STORACHA_PROOF;

  if (!key || !storachaProof) {
    throw new Error(
      "Storacha credentials not configured. Please set STORACHA_SING_PRIVATE_KEY and STORACHA_PROOF secrets in Cloudflare.",
    );
  }

  // Clean the proof by removing whitespace and newlines
  storachaProof = storachaProof.replace(/\s+/g, "").trim();

  // NOTE: Cloudflare Secrets support full proof size, no decryption needed
  // Unlike Netlify which had size limits and required encrypted proof

  try {
    const proof = await Proof.parse(storachaProof);
    const principal = Signer.parse(key);
    const store = new StoreMemory();
    const client = await create({ principal, store });

    // Use the delegation directly instead of loadDelegation
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    const audience = DID.parse(did);
    const abilities = [
      "space/blob/add",
      "space/index/add",
      "filecoin/offer",
      "upload/add",
    ];
    const expiration = Math.floor(Date.now() / 1000) + 120; // 120 seconds from now

    const delegation = await client.createDelegation(
      audience,
      abilities as any,
      {
        expiration,
      },
    );

    const archive = await delegation.archive();
    if (!archive.ok) {
      throw new Error("Failed to archive delegation");
    }
    return archive.ok;
  } catch (error) {
    console.error("Error in generateDelegation:", error);
    throw error;
  }
}
