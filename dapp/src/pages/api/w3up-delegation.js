// /src/pages/api/w3up-delegation/[did].js
import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import * as DID from "@ipld/dag-ucan/did";
import {
  verifyChallengeSignature,
  verifyDidHash,
} from "@service/VerifyChallengeService";
import {
  getProjectFromId,
  getProjectFromName,
} from "@service/ReadContractService";
import crypto from "crypto";
import pkg from "js-sha3";
const { keccak256 } = pkg;

export const prerender = false;

export const POST = async ({ request }) => {
  if (request.headers.get("Content-Type") === "application/json") {
    const body = await request.json();
    const { signedTxXdr, projectName, did } = body;

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

    const maintainerPublicKey = await getProjectMaintainers(projectName);

    if (!maintainerPublicKey) {
      return new Response(
        JSON.stringify({ error: "Can not get maintainers" }),
        {
          status: 400,
        },
      );
    }
    verifyChallengeSignature(signedTxXdr, maintainerPublicKey);

    try {
      const archive = await generateDelegation(did);

      return new Response(archive, {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" },
      });
    } catch (err) {
      console.error("Error creating delegation:", err);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
      });
    }
  }
  return new Response(null, { status: 400 });
};

const getProjectMaintainers = async (projectName) => {
  if (projectName) {
    const projectId = Buffer.from(
      keccak256.create().update(projectName).digest(),
    );

    const res = await getProjectFromId(projectId);
    const projectInfo = res.data;

    if (projectInfo && projectInfo.maintainers) {
      return projectInfo.maintainers;
    } else if (res.error) {
      return null;
    }
  } else {
    return null;
  }
};

async function generateDelegation(did) {
  const key = import.meta.env.STORACHA_SING_PRIVATE_KEY;
  const storachaProof = import.meta.env.STORACHA_PROOF;

  const principal = Signer.parse(key);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  const proof = await Proof.parse(storachaProof);
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

  console.log(
    "delegation expire time:",
    new Date(delegation.expiration * 1000).toUTCString(),
  );

  const archive = await delegation.archive();
  return archive.ok;
}
