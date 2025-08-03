import Tansu from "../contracts/soroban_tansu";
import * as pkg from "js-sha3";
const { keccak256 } = pkg;
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
  try {
    const res = await Tansu.get_commit({
      project_key: projectId,
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

async function getProjectFromName(
  projectName: string,
): Promise<Project | null> {
  // Skip if project name is empty
  if (!projectName || projectName.trim() === "") {
    return null;
  }

  const projectId = Buffer.from(
    keccak256.create().update(projectName.toLowerCase()).digest(),
  );

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
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

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
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );
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
  const project_key = Buffer.from(
    keccak256.create().update(projectName).digest(),
  );
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

  try {
    const res = await Tansu.get_badges({
      key: projectId,
    });

    // Check for simulation errors
    checkSimulationError(res);

    return res.result;
  } catch {
    // Never show toast error for badges not found
    return null;
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
};
