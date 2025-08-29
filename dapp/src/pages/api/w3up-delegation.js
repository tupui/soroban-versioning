// /src/pages/api/w3up-delegation/[did].js
import * as DID from "@ipld/dag-ucan/did";
import { getProjectFromId } from "@service/ReadContractService";
import pkg from "js-sha3";
import decryptProof from "../../utils/decryptAES256";
const { keccak256 } = pkg;

// This must be a server-side endpoint to handle POST requests
export const prerender = false;

/**
 * Validates the request based on the type
 * @param {string} type - The type of delegation request ('proposal' or 'member')
 * @param {string} signedTxXdr - The signed transaction XDR
 * @param {string} projectName - The project name (only required for proposals)
 * @returns {Promise<string[]|null>} - Returns maintainer public keys for proposals, or an empty array for members
 */
async function validateRequest(type, signedTxXdr, projectName) {
  const { Transaction, xdr } = await import("@stellar/stellar-sdk");
  const tx = new Transaction(
    signedTxXdr,
    import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
  );

  // Extract the signer's public key from the transaction
  const signerPublicKey = tx.source;

  switch (type) {
    case "proposal":
      if (!projectName) {
        throw new Error("Project name is required for proposal delegation");
      }

      const projectId = Buffer.from(
        keccak256.create().update(projectName.toLowerCase()).digest(),
      );

      try {
        const projectInfo = await getProjectFromId(projectId);
        if (!projectInfo || !projectInfo.maintainers) {
          throw new Error("Project not found or has no maintainers");
        }

        // Verify that the signer is a maintainer
        if (!projectInfo.maintainers.includes(signerPublicKey)) {
          throw new Error("Only maintainers can create proposals");
        }

        // Verify this is a create_proposal transaction
        // The transaction should have invoke host function operation
        const operation = tx.operations[0];
        if (!operation || operation.type !== "invokeHostFunction") {
          throw new Error("Invalid transaction: expected create_proposal call");
        }

        return projectInfo.maintainers;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error validating proposal request:", error);
        }
        throw new Error("Invalid request format");
      }

    case "member":
      // For member registration, verify this is an add_member transaction
      try {
        // Verify this is an add_member transaction
        const operation = tx.operations[0];
        if (!operation || operation.type !== "invokeHostFunction") {
          throw new Error("Invalid transaction: expected add_member call");
        }

        return [];
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error validating member request:", error);
        }
        throw error;
      }

    case "project":
      // For project registration we currently perform the same lightweight validation
      // as the member flow – ensure the transaction contains an InvokeHostFunction op.
      try {
        const operation = tx.operations[0];
        if (!operation || operation.type !== "invokeHostFunction") {
          throw new Error(
            "Invalid transaction: expected register project call",
          );
        }

        return [];
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error validating project request:", error);
        }
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
      headers: { "Content-Type": "application/json" },
    });
  }
};

async function generateDelegation(did) {
  // Validate environment variables first
  const key = import.meta.env.STORACHA_SING_PRIVATE_KEY;
  let storachaProof = import.meta.env.STORACHA_PROOF;

  if (!key || !storachaProof) {
    throw new Error(
      "Storacha credentials not configured. Please set STORACHA_SING_PRIVATE_KEY and STORACHA_PROOF environment variables.",
    );
  }

  // Dynamic imports to avoid initialization issues
  const { create } = await import("@web3-storage/w3up-client");
  const { Signer } = await import(
    "@web3-storage/w3up-client/principal/ed25519"
  );
  const Proof = await import("@web3-storage/w3up-client/proof");
  const { StoreMemory } = await import(
    "@web3-storage/w3up-client/stores/memory"
  );

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
  if (import.meta.env.DEV) {
    // Log expiration only in development
    console.log("expiration time:", expirationDate.toUTCString());
  }

  const delegation = await client.createDelegation(audience, abilities, {
    expiration,
  });

  const archive = await delegation.archive();
  return archive.ok;
}
