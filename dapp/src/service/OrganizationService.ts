/**
 * Organization Service - Handle organization-related contract interactions
 */

import Tansu from "../contracts/soroban_tansu";
import { loadedPublicKey } from "./walletService";
import { deriveProjectKey } from "../utils/projectKey";
import { checkSimulationError } from "../utils/contractErrors";
import { handleFreighterError } from "../utils/errorHandler";
import { signAndSend } from "./TxService";
import { Buffer } from "buffer";

/**
 * Get configured contract client instance
 */
function getClient() {
  const publicKey = loadedPublicKey();
  if (!publicKey) {
    throw new Error("Please connect your wallet first");
  }

  Tansu.options.publicKey = publicKey;
  return Tansu;
}

/**
 * Universal transaction submitter for organization calls
 */
async function submitTransaction(assembledTx: any): Promise<any> {
  const hasSimulate = typeof assembledTx?.simulate === "function";
  const hasToXdr = typeof assembledTx?.toXDR === "function";
  if (!hasSimulate && !hasToXdr) {
    return assembledTx?.result ?? assembledTx;
  }

  try {
    return await signAndSend(assembledTx);
  } catch (error: any) {
    const errorMessage = handleFreighterError(error, "Transaction submission");
    throw new Error(errorMessage);
  }
}

/**
 * Register a new organization
 */
export async function registerOrganization(
  organizationName: string,
  maintainers: string[],
  ipfs: string,
): Promise<string> {
  const client = getClient();
  const publicKey = loadedPublicKey()!;

  try {
    // Check if the method exists
    if (typeof (client as any).register_organization !== "function") {
      throw new Error(
        "Organizations feature is not available yet. The contract needs to be upgraded and bindings regenerated.",
      );
    }

    const assembledTx = await (client as any).register_organization({
      maintainer: publicKey,
      name: organizationName,
      maintainers,
      ipfs,
    });

    checkSimulationError(assembledTx as any);

    const result = await submitTransaction(assembledTx);
    return Buffer.from(result).toString("hex");
  } catch (error: any) {
    console.error("Error registering organization:", error);
    throw error;
  }
}

/**
 * Add a project to an organization
 */
export async function addProjectToOrganization(
  organizationName: string,
  projectName: string,
): Promise<boolean> {
  const client = getClient();
  const publicKey = loadedPublicKey()!;

  const orgKey = deriveProjectKey(organizationName);
  const projectKey = deriveProjectKey(projectName);

  const assembledTx = await (client as any).add_project_to_organization({
    maintainer: publicKey,
    organization_key: orgKey,
    project_key: projectKey,
  });

  checkSimulationError(assembledTx as any);

  await submitTransaction(assembledTx);
  return true;
}

/**
 * Get organization information
 */
export async function getOrganization(organizationName: string): Promise<any> {
  const client = getClient();
  const orgKey = deriveProjectKey(organizationName);

  const orgTx = await (client as any).get_organization({
    organization_key: orgKey,
  });

  checkSimulationError(orgTx as any);
  return orgTx.result;
}

/**
 * Get projects in an organization
 */
export async function getOrganizationProjects(
  organizationName: string,
  page: number = 0,
): Promise<any[]> {
  const client = getClient();
  const orgKey = deriveProjectKey(organizationName);

  const projectsTx = await (client as any).get_organization_projects({
    organization_key: orgKey,
    page,
  });

  checkSimulationError(projectsTx as any);
  return projectsTx.result || [];
}

/**
 * Get total number of projects in an organization
 */
export async function getOrganizationProjectsCount(
  organizationName: string,
): Promise<number> {
  const client = getClient();
  const orgKey = deriveProjectKey(organizationName);

  const countTx = await (client as any).get_organization_projects_count({
    organization_key: orgKey,
  });

  checkSimulationError(countTx as any);
  return Number(countTx.result) || 0;
}

/**
 * Get a page of organizations
 */
export async function getOrganizations(page: number = 0): Promise<any[]> {
  const client = getClient();

  try {
    const orgsTx = await (client as any).get_organizations({
      page,
    });

    checkSimulationError(orgsTx as any);
    return orgsTx.result || [];
  } catch (error: any) {
    // Handle case when no organizations exist yet (NoOrganizationPageFound error code 30)
    const errorMessage = error?.message || error?.toString() || "";
    if (
      errorMessage.includes("NoOrganizationPageFound") ||
      errorMessage.includes("Error(Contract, #30)") ||
      errorMessage.includes("HostError: Error(Contract, #30)")
    ) {
      return [];
    }
    // For other errors, still return empty array to prevent UI crashes
    console.error("Error loading organizations:", error);
    return [];
  }
}

/**
 * Update organization configuration
 */
export async function updateOrganizationConfig(
  organizationName: string,
  ipfs: string,
): Promise<boolean> {
  const client = getClient();
  const publicKey = loadedPublicKey()!;
  const orgKey = deriveProjectKey(organizationName);

  const assembledTx = await (client as any).update_organization_config({
    maintainer: publicKey,
    organization_key: orgKey,
    ipfs,
  });

  checkSimulationError(assembledTx as any);

  await submitTransaction(assembledTx);
  return true;
}
