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
  "AAAAAgAAAACQt/D2JqBiO4qjHZ9Lydg563PkqI2baw/Ann6KBfEAJgAEqYcABNbsAAAAOwAAAAEAAAAAAAAAAAAAAABo/8DKAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAABtZOxVAPZGMVlE+Q7x9NT4HQHDICXsY0QhHL7inqKtsoAAAANdXBkYXRlX2NvbmZpZwAAAAAAAAUAAAASAAAAAAAAAACQt/D2JqBiO4qjHZ9Lydg563PkqI2baw/Ann6KBfEAJgAAAA0AAAAgN66DwG/eEENyR0MzWsLzkZMHiS7mMHzOjAxj6qVJ4VYAAAAQAAAAAQAAAAIAAAASAAAAAAAAAACQt/D2JqBiO4qjHZ9Lydg563PkqI2baw/Ann6KBfEAJgAAABIAAAAAAAAAANRKkGtkALzwWInWESPmSayW2y+1b5ec2H38KXiHDbcBAAAADgAAACtodHRwczovL2dpdGh1Yi5jb20vdHVwdWkvc29yb2Jhbi12ZXJzaW9uaW5nAAAAAA4AAAA7YmFmeWJlaWVnNW9qNHgyamo0Mmp2ZG93dTVvcm40Ym51bXdkNmJieTJ5d2J0cWgzb29kempjYWczbm0AAAAAAQAAAAAAAAAAAAAAAbWTsVQD2RjFZRPkO8fTU+B0BwyAl7GNEIRy+4p6irbKAAAADXVwZGF0ZV9jb25maWcAAAAAAAAFAAAAEgAAAAAAAAAAkLfw9iagYjuKox2fS8nYOetz5KiNm2sPwJ5+igXxACYAAAANAAAAIDeug8Bv3hBDckdDM1rC85GTB4ku5jB8zowMY+qlSeFWAAAAEAAAAAEAAAACAAAAEgAAAAAAAAAAkLfw9iagYjuKox2fS8nYOetz5KiNm2sPwJ5+igXxACYAAAASAAAAAAAAAADUSpBrZAC88FiJ1hEj5kmsltsvtW+XnNh9/Cl4hw23AQAAAA4AAAAraHR0cHM6Ly9naXRodWIuY29tL3R1cHVpL3Nvcm9iYW4tdmVyc2lvbmluZwAAAAAOAAAAO2JhZnliZWllZzVvajR4MmpqNDJqdmRvd3U1b3JuNGJudW13ZDZiYnkyeXdidHFoM29vZHpqY2FnM25tAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAgAAAAYAAAABtZOxVAPZGMVlE+Q7x9NT4HQHDICXsY0QhHL7inqKtsoAAAAUAAAAAQAAAAefVkApMbEmO3Y8tfgVhEQYNf7zX7aT5ayF7GjJl+BM6wAAAAEAAAAGAAAAAbWTsVQD2RjFZRPkO8fTU+B0BwyAl7GNEIRy+4p6irbKAAAAEAAAAAEAAAACAAAADwAAAANLZXkAAAAADQAAACA3roPAb94QQ3JHQzNawvORkweJLuYwfM6MDGPqpUnhVgAAAAEAJ4jaAAABxAAAAcQAAAAAAAJUmAAAAAEF8QAmAAAAQE1ODA4SpQ+lVI/8xGjnVLzv2ViW+11O8KVWdIOmDPzRoP0KZtrMSPb0IbuKFeh4Y0hXhfMuvDvT/9XPbihM8QY=";

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
