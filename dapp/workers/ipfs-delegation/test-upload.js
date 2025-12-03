#!/usr/bin/env node
import * as Client from "@storacha/client";
import * as Delegation from "@ucanto/core/delegation";

const DEV_URL = "https://ipfs-testnet.tansu.dev";
const PROD_URL = "https://ipfs.tansu.dev";

const ENV = process.env.ENV || "LOCAL";

let WORKER_URL = "http://localhost:8787";

if (ENV === "DEV") {
  WORKER_URL = DEV_URL;
} else if (ENV === "PROD") {
  WORKER_URL = PROD_URL;
}

const SIGNED_TX_XDR =
  "AAAAAgAAAABp/3HlzdWaOiCitoNv2POvJeGeySK0g0HOsaNJTVWXxQARJ7oDE0/AAAAICQAAAAEAAAAAAAAAAAAAAABpC0DNAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAAB7oarU9v55nF2Vvpaovc6dXOCXCuqI1Xp9vFeurNmuIwAAAAKYWRkX21lbWJlcgAAAAAAAgAAABIAAAAAAAAAAGn/ceXN1Zo6IKK2g2/Y868l4Z7JIrSDQc6xo0lNVZfFAAAADgAAADtiYWZ5YmVpYW5ycW9zaTVmcnlueDV1ZWZva3FwYjVod2Z6NjNrd2p6cTY0a2xxbW1qbDdpZWdwanJucQAAAAABAAAAAAAAAAAAAAAB7oarU9v55nF2Vvpaovc6dXOCXCuqI1Xp9vFeurNmuIwAAAAKYWRkX21lbWJlcgAAAAAAAgAAABIAAAAAAAAAAGn/ceXN1Zo6IKK2g2/Y868l4Z7JIrSDQc6xo0lNVZfFAAAADgAAADtiYWZ5YmVpYW5ycW9zaTVmcnlueDV1ZWZva3FwYjVod2Z6NjNrd2p6cTY0a2xxbW1qbDdpZWdwanJucQAAAAAAAAAAAQAAAAAAAAACAAAABgAAAAHuhqtT2/nmcXZW+lqi9zp1c4JcK6ojVen28V66s2a4jAAAABQAAAABAAAAB5xtmIIPFyKSNtT3vpxJIE8SGSswv5QJTIyMfIOJrezvAAAAAQAAAAYAAAAB7oarU9v55nF2Vvpaovc6dXOCXCuqI1Xp9vFeurNmuIwAAAAQAAAAAQAAAAIAAAAPAAAABk1lbWJlcgAAAAAAEgAAAAAAAAAAaf9x5c3VmjogoraDb9jzryXhnskitINBzrGjSU1Vl8UAAAABACUrtQAAAAAAAAD4AAAAAAAIk7AAAAABTVWXxQAAAEA4bJv6/+XK2ipxpzOvQt/KS7PJUIVvnVvIOPWRj/XR2f8mTC+v4wH51AIgqj8N2Azuahq2uCkasID6d94v94sK";

async function test() {
  console.log(`Connecting to worker at: ${WORKER_URL}`);

  // Create the client first to get the agent DID (matching FlowService pattern)
  const client = await Client.create();
  const clientDid = client.agent.did();

  console.log(`Using DID: ${clientDid}`);

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ did: clientDid, signedTxXdr: SIGNED_TX_XDR }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Worker error: ${errorText}`);
    throw new Error(`Worker returned ${response.status}: ${errorText}`);
  }

  const delegationArchive = await response.arrayBuffer();
  const uint8 = new Uint8Array(delegationArchive);
  const extracted = await Delegation.extract(uint8);

  // Handle extraction result (following FlowService pattern)
  let delegation;
  if ("ok" in extracted) {
    delegation = extracted.ok;
  } else if (Array.isArray(extracted)) {
    delegation = extracted[0];
  }

  if (!delegation) {
    throw new Error("Failed to extract a valid delegation from archive");
  }

  console.log("✅ Delegation received and extracted successfully!");

  // Client already created above, now add the delegation to it
  const space = await client.addSpace(delegation);
  await client.setCurrentSpace(space.did());

  console.log(`✅ Space loaded: ${space.did()}`);

  // Create a test file
  const testFile = new File(
    ["This is a test file uploaded via the IPFS delegation worker!"],
    "test.txt",
    { type: "text/plain" },
  );

  // Upload to IPFS
  console.log("Uploading file to IPFS...");
  const directoryCid = await client.uploadDirectory([testFile]);
  if (!directoryCid) {
    throw new Error("Upload failed");
  }

  console.log(`\n✅ Upload successful!`);
  console.log(`CID: ${directoryCid.toString()}`);
  console.log(`URL: https://${directoryCid.toString()}.ipfs.w3s.link/test.txt`);
}

test().catch(console.error);
