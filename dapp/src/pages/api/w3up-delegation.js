// /src/pages/api/w3up-delegation/[did].js
import * as DID from "@ipld/dag-ucan/did";
import { getProjectFromId } from "@service/ReadContractService";
import {
  verifyChallengeSignature,
  verifyDidHash,
} from "@service/VerifyChallengeService";
import pkg from "js-sha3";
import decryptProof from "../../utils/decryptAES256";
const { keccak256 } = pkg;

export const prerender = false;

/**
 * Validates the request based on the type
 * @param {string} type - The type of delegation request ('proposal' or 'member')
 * @param {string} signedTxXdr - The signed transaction XDR
 * @param {string} projectName - The project name (only required for proposals)
 * @returns {Promise<string[]|null>} - Returns maintainer public keys for proposals, or an empty array for members
 */
async function validateRequest(type, signedTxXdr, projectName) {
  switch (type) {
    case "proposal":
      if (!projectName) {
        throw new Error("Project name is required for proposal delegation");
      }

      const projectId = Buffer.from(
        keccak256.create().update(projectName).digest(),
      );

      try {
        const projectInfo = await getProjectFromId(projectId);
        if (!projectInfo || !projectInfo.maintainers) {
          throw new Error("Project not found or has no maintainers");
        }

        // Verify that the signer is a maintainer
        verifyChallengeSignature(signedTxXdr, projectInfo.maintainers);
        return projectInfo.maintainers;
      } catch (error) {
        console.error("Error validating proposal request:", error);
        throw error;
      }

    case "member":
      // For member registration, we only need to verify the signature is valid
      // No project-specific validation needed
      try {
        // Extract the signer's public key from the transaction
        const { Transaction } = await import("@stellar/stellar-sdk");
        const tx = new Transaction(
          signedTxXdr,
          import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
        );
        const signerPublicKey = tx.source;

        // Verify the signature is valid (using a single-element array)
        verifyChallengeSignature(signedTxXdr, [signerPublicKey]);
        return [];
      } catch (error) {
        console.error("Error validating member request:", error);
        throw error;
      }

    default:
      throw new Error(`Unknown delegation type: ${type}`);
  }
}

export const POST = async ({ request }) => {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new Response(null, { status: 400 });
  }

  try {
    const body = await request.json();
    const { signedTxXdr, projectName, did, type = "proposal" } = body;

    // Verify the DID hash matches the transaction memo
    const didVerified = verifyDidHash(signedTxXdr, did);
    if (!didVerified) {
      return new Response(
        JSON.stringify({
          error: "DID hash does not match the transaction memo",
        }),
        {
          status: 400,
        },
      );
    }

    // Validate the request based on type
    await validateRequest(type, signedTxXdr, projectName);

    // Generate the delegation
    const archive = await generateDelegation(did);

    return new Response(archive, {
      status: 200,
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch (err) {
    console.error("Error creating delegation:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: err.message.includes("not found") ? 404 : 500,
    });
  }
};

async function generateDelegation(did) {
  // Dynamic imports to avoid initialization issues
  const { create } = await import("@web3-storage/w3up-client");
  const { Signer } = await import(
    "@web3-storage/w3up-client/principal/ed25519"
  );
  const Proof = await import("@web3-storage/w3up-client/proof");
  const { StoreMemory } = await import(
    "@web3-storage/w3up-client/stores/memory"
  );

  const key = import.meta.env.STORACHA_SING_PRIVATE_KEY;
  let storachaProof = import.meta.env.STORACHA_PROOF;
  if (storachaProof.length === 64) {
    storachaProof = await decryptProof(storachaProof);
  }

  const proof = await Proof.parse(storachaProof);

  const principal = Signer.parse(key);
  const store = new StoreMemory();
  const client = await create({ principal, store });

  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  const audience = DID.parse(did);
  const abilities = [
    "space/blob/add",
    "space/index/add",
    "filecoin/offer",
    "upload/add",
  ];
  const expiration = Math.floor(Date.now() / 1000) + 60;
  const expirationDate = new Date(expiration * 1000);
  console.log("expiration time:", expirationDate.toUTCString());

  const delegation = await client.createDelegation(audience, abilities, {
    expiration,
  });

  const archive = await delegation.archive();
  return archive.ok;
}
