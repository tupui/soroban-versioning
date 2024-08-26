import pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";

import { kit, loadedPublicKey } from "./stellar-wallets-kit.ts";
import Versioning from "../contracts/soroban_versioning";

const projectState: {
  project_name: string | undefined;
  project_id: Buffer | undefined;
} = {
  project_name: undefined,
  project_id: undefined,
};

function loadedProjectId(): Buffer | undefined {
  return projectState.project_id;
}

function setProjectId(project_name: string): void {
  projectState.project_name = project_name;
  // @ts-ignore
  projectState.project_id = new Buffer.from(
    keccak256.create().update(project_name).digest(),
  );
}

async function getProjectHash(): Promise<string | void> {
  if (projectState.project_id === undefined) {
    alert("No project defined");
    return;
  }
  const res = await Versioning.get_commit({
    project_key: projectState.project_id,
  });
  return res.result;
}

async function commitHash(commit_hash: string): Promise<boolean> {
  if (!projectState.project_id) {
    alert("No project defined");
    return false;
  }
  const publicKey = loadedPublicKey();

  if (!publicKey) {
    alert("Please connect your wallet first");
    return false;
  } else {
    Versioning.options.publicKey = publicKey;
  }

  const tx = await Versioning.commit({
    maintainer: publicKey,
    project_key: projectState.project_id,
    hash: commit_hash,
  });
  try {
    await tx.signAndSend({
      signTransaction: async (xdr) => {
        const { signedTxXdr } = await kit.signTransaction(xdr);
        return signedTxXdr;
      },
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export { commitHash, getProjectHash, loadedProjectId, setProjectId };
