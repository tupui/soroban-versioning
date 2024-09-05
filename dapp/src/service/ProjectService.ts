import * as pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";

import { kit, loadedPublicKey } from "../components/stellar-wallets-kit";
import Versioning from "../contracts/soroban_versioning";
import type { Project } from "soroban_versioning";

const projectState: {
  project_name: string | undefined;
  project_id: Buffer | undefined;
} = {
  project_name: undefined,
  project_id: undefined,
};

const projectInfo: {
  project_maintainers: string[] | undefined;
  project_config_url: string | undefined;
  project_config_hash: string | undefined;
} = {
  project_maintainers: undefined,
  project_config_url: undefined,
  project_config_hash: undefined,
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

function loadedProjectInfo(): Project | undefined {
  if (!projectInfo.project_maintainers || !projectInfo.project_config_url || !projectInfo.project_config_hash || !projectState.project_name) {
    return undefined;
  }
  return {
    maintainers: projectInfo.project_maintainers,
    name: projectState.project_name,
    config: {
      url: projectInfo.project_config_url,
      hash: projectInfo.project_config_hash
    }
  };
}

function setProject(project: Project): void {
  projectInfo.project_maintainers = project.maintainers;
  projectInfo.project_config_url = project.config.url;
  projectInfo.project_config_hash = project.config.hash;
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

async function registerProject(
  maintainers: string,
  config_url: string,
  config_hash: string,
  domain_contract_id: string,
): Promise<boolean> {
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

  const maintainers_ = maintainers.split(",");

  const tx = await Versioning.register({
    // @ts-ignore
    name: projectState.project_name,
    maintainer: publicKey,
    maintainers: maintainers_,
    url: config_url,
    hash: config_hash,
    domain_contract_id: domain_contract_id,
  });
  console.log("tx:", tx);
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

async function getProject(): Promise<Project | void> {
  if (projectState.project_id === undefined) {
    alert("No project defined");
    return;
  }
  const res = await Versioning.get_project({
    project_key: projectState.project_id,
  });
  return res.result;
}

async function updateConfig(
  maintainers: string,
  config_url: string,
  config_hash: string,
): Promise<boolean> {
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
  const maintainers_ = maintainers.split(",");

  const tx = await Versioning.update_config({
    maintainer: publicKey,
    key: projectState.project_id,
    maintainers: maintainers_,
    url: config_url,
    hash: config_hash,
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

export {
  commitHash,
  getProjectHash,
  loadedProjectId,
  loadedProjectInfo,
  registerProject,
  setProjectId,
  getProject,
  setProject,
  updateConfig,
};
