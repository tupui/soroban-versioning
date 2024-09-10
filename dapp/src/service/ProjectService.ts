import { kit, loadedPublicKey } from "../components/stellar-wallets-kit";
import Versioning from "../contracts/soroban_versioning";
import type { Project } from "soroban_versioning";

import {loadedProjectId, loadedProjectInfo} from "./StateService";

async function getProjectHash(): Promise<string | void> {
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    alert("No project defined");
    return;
  }
  const res = await Versioning.get_commit({
    project_key: projectId,
  });
  return res.result;
}

async function commitHash(commit_hash: string): Promise<boolean> {
  const projectId = loadedProjectId();

  if (!projectId) {
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
    project_key: projectId,
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
  const projectId = loadedProjectId();
  const projectInfo = loadedProjectInfo();

  if (!projectId || !projectInfo) {
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
    name: projectInfo.name,
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
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    alert("No project defined");
    return;
  }
  const res = await Versioning.get_project({
    project_key: projectId,
  });
  return res.result;
}

async function updateConfig(
  maintainers: string,
  config_url: string,
  config_hash: string,
): Promise<boolean> {
  const projectId = loadedProjectId();

  if (!projectId) {
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
    key: projectId,
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
  getProject,
  getProjectHash,
  registerProject,
  updateConfig,
};
