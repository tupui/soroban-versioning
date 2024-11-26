// /src/pages/api/w3up-delegation/[did].js
import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Proof from "@web3-storage/w3up-client/proof";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import * as DID from "@ipld/dag-ucan/did";

export const prerender = false;

export const POST = async ({ request }) => {
  if (request.headers.get("Content-Type") === "application/json") {
    const body = await request.json();
    const { did } = body;
    try {
      const archive = await backend(did);

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

async function backend(did) {
  const key = import.meta.env.PUBLIC_STORACHA_SING_PRIVATE_KEY;
  const storachaProof = import.meta.env.PUBLIC_STORACHA_PROOF;

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
  const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const delegation = await client.createDelegation(audience, abilities, {
    expiration,
  });

  const archive = await delegation.archive();
  return archive.ok;
}
