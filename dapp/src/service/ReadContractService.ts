import Versioning from "../contracts/soroban_versioning";
import * as pkg from "js-sha3";
const { keccak256 } = pkg;
import { Buffer } from "buffer";
import { loadedProjectId } from "./StateService";
import { modifyProposalFromContract } from "utils/utils";
import type { Project, Proposal } from "soroban_versioning";
import type { Proposal as ModifiedProposal } from "types/proposal";

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

async function getProjectFromName(
  projectName: string,
): Promise<Project | void> {
  const projectId = Buffer.from(
    keccak256.create().update(projectName).digest(),
  );

  if (projectId === undefined) {
    alert("No project defined");
    return;
  }
  const res = await Versioning.get_project({
    project_key: projectId,
  });
  return res.result;
}

async function getProposals(
  project_name: string,
  page: number,
): Promise<ModifiedProposal[]> {
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );
  try {
    const res = await Versioning.get_dao({
      project_key: project_key,
      page: page,
    });

    const proposals: ModifiedProposal[] = res.result.proposals.map(
      (proposal: Proposal) => {
        return modifyProposalFromContract(proposal);
      },
    );
    return proposals;
  } catch (e) {
    console.error(e);
    return [];
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
    const res = await Versioning.get_proposal({
      project_key: project_key,
      proposal_id: proposalId,
    });

    const proposal: Proposal = res.result;
    return modifyProposalFromContract(proposal);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export {
  getProject,
  getProjectHash,
  getProjectFromName,
  getProposals,
  getProposal,
};
