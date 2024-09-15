import { kit, loadedPublicKey } from "../components/stellar-wallets-kit";
import Versioning from "../contracts/soroban_versioning";

import { loadedProjectId } from "./StateService";

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
  project_name: string,
  maintainers: string,
  config_url: string,
  config_hash: string,
  domain_contract_id: string,
): Promise<boolean> {
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
    name: project_name,
    maintainer: publicKey,
    maintainers: maintainers_,
    url: config_url,
    hash: config_hash,
    domain_contract_id: domain_contract_id,
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
  registerProject,
  updateConfig,
};
