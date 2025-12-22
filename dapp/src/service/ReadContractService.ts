import Tansu from "../contracts/soroban_tansu";
import { deriveProjectKey } from "../utils/projectKey";
import { Buffer } from "buffer";
import { loadedProjectId } from "./StateService";
import { modifyProposalFromContract } from "utils/utils";
import type { Project, Proposal, Member, Badges } from "../../packages/tansu";
import type { Proposal as ModifiedProposal } from "types/proposal";
import { checkSimulationError } from "utils/contractErrors";

async function getProjectHash(): Promise<string | null> {
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    // This is an expected condition when no project is selected
    return null;
  }

  // Ensure projectId is a proper Buffer
  const projectKey = Buffer.isBuffer(projectId)
    ? projectId
    : Buffer.from(projectId, "hex");

  try {
    const res = await Tansu.get_commit({
      project_key: projectKey,
    });

    // Check for simulation errors
    checkSimulationError(res);

    return res.result;
  } catch {
    // Never show toast error for project hash not found
    return null;
  }
}

async function getProject(): Promise<Project | null> {
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    // This is an expected condition when no project is selected
    return null;
  }

  // Ensure projectId is a proper Buffer
  const projectKey = Buffer.isBuffer(projectId)
    ? projectId
    : Buffer.from(projectId, "hex");

  try {
    const res = await Tansu.get_project({
      project_key: projectKey,
    });

    // Check for simulation errors
    checkSimulationError(res);

    return res.result;
  } catch {
    // Never show toast error for project not found
    return null;
  }
}

async function getProjectFromName(
  projectName: string,
): Promise<Project | null> {
  // Skip if project name is empty
  if (!projectName || projectName.trim() === "") {
    return null;
  }

  const projectId = deriveProjectKey(projectName);

  try {
    const res = await Tansu.get_project({
      project_key: projectId,
    });

    // Check for simulation errors
    checkSimulationError(res);

    return res.result;
  } catch {
    // Never show toast error for project not found - this is always an expected condition
    // when searching for projects
    return null;
  }
}

async function getProjectFromId(projectId: Buffer): Promise<Project | null> {
  try {
    const res = await Tansu.get_project({
      project_key: projectId,
    });

    // Check for simulation errors
    checkSimulationError(res);

    return res.result;
  } catch {
    // Never show toast error for project not found
    return null;
  }
}

async function getProposalPages(project_name: string): Promise<number | null> {
  const project_key = deriveProjectKey(project_name);

  try {
    const checkPageExist = async (page: number) => {
      try {
        const res = await Tansu.get_dao({
          project_key,
          page,
        });

        // Check for simulation errors
        checkSimulationError(res);

        return res.result.proposals.length > 0;
      } catch {
        // Silently handle errors for this internal function
        return false;
      }
    };

    for (let page = 1; ; page *= 2) {
      const isPageExist = await checkPageExist(page);
      if (isPageExist) continue;
      if (page <= 2) return 1;
      let f = page / 2,
        t = page;
      while (t - f > 1) {
        const m = Math.floor((f + t) / 2);
        const isPageExist = await checkPageExist(m);
        if (isPageExist) f = m;
        else t = m;
      }
      return f;
    }
  } catch {
    // Never show toast error for proposal pages not found
    return null;
  }
}

async function getProposals(
  project_name: string,
  page: number,
): Promise<ModifiedProposal[] | null> {
  const project_key = deriveProjectKey(project_name);
  try {
    const res = await Tansu.get_dao({
      project_key: project_key,
      page: page,
    });

    // Check for simulation errors
    checkSimulationError(res);

    const proposals: ModifiedProposal[] = res.result.proposals.map(
      (proposal: Proposal) => {
        return modifyProposalFromContract(proposal);
      },
    );
    return proposals;
  } catch {
    // Never show toast error for proposals not found
    return null;
  }
}

async function getProposal(
  projectName: string,
  proposalId: number,
): Promise<ModifiedProposal | null> {
  const project_key = deriveProjectKey(projectName);
  try {
    const res = await Tansu.get_proposal({
      project_key: project_key,
      proposal_id: proposalId,
    });

    // Check for simulation errors
    checkSimulationError(res);

    const proposal: Proposal = res.result;
    return modifyProposalFromContract(proposal);
  } catch {
    // Never show toast error for proposal not found
    return null;
  }
}

async function getMember(memberAddress: string): Promise<Member | null> {
  // Skip if address is empty
  if (!memberAddress || memberAddress.trim() === "") {
    return null;
  }

  try {
    const res = await Tansu.get_member({
      member_address: memberAddress,
    });

    // Check for simulation errors
    checkSimulationError(res);

    return res.result;
  } catch {
    // Never show toast error for member not found - this is always an expected condition
    // when searching for members
    return null;
  }
}

async function getBadges(): Promise<Badges | null> {
  const projectId = loadedProjectId();
  if (projectId === undefined) {
    // This is an expected condition when no project is selected
    return null;
  }

  // Ensure projectId is a proper Buffer
  const projectKey = Buffer.isBuffer(projectId)
    ? projectId
    : Buffer.from(projectId, "hex");

  try {
    // Use current bindings spec
    const res: any = await (Tansu as any).get_badges({ key: projectKey });

    // Check for simulation errors
    checkSimulationError(res);

    return res.result;
  } catch {
    // Never show toast error for badges not found
    return null;
  }
}

async function getAllProjects(): Promise<Project[]> {
  try {
    const allProjects: Project[] = [];
    let page = 0;

    // Fetch pages sequentially until we get an empty page
    while (true) {
      try {
        const res = await Tansu.get_projects({ page });
        checkSimulationError(res);
        
        // If page is empty, we've reached the end
        if (!res.result || res.result.length === 0) {
          break;
        }
        
        allProjects.push(...res.result);
        page++;
      } catch {
        // If we get an error, stop fetching
        break;
      }
    }

    return allProjects;
  } catch {
    return [];
  }
}

export {
  getProject,
  getProjectHash,
  getProjectFromName,
  getProjectFromId,
  getProposalPages,
  getProposals,
  getProposal,
  getMember,
  getBadges,
  getAllProjects,
};

/**
 * Check whether anonymous voting is configured for a given project name.
 * Returns true when configuration exists, false otherwise.
 */
export async function hasAnonymousVotingConfig(
  projectName: string,
): Promise<boolean> {
  try {
    const project_key = deriveProjectKey(projectName);
    const tx = await (Tansu as any).get_anonymous_voting_config({
      project_key,
    });
    try {
      checkSimulationError(tx);
      return !!tx.result;
    } catch (_) {
      return false;
    }
  } catch (_) {
    return false;
  }
}
