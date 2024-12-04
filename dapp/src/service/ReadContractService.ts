import Versioning from "../contracts/soroban_versioning";
import type { Project } from "soroban_versioning";
import * as pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";

import { loadedProjectId } from "./StateService";
import type {
  Proposal as ModifiedProposal,
  ProposalStatus,
} from "types/proposal";
import type { Proposal } from "soroban_versioning";

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
        return {
          id: proposal.id,
          title: proposal.title,
          ipfs: proposal.ipfs,
          nqg: proposal.nqg,
          status: proposal.status.tag.toLocaleLowerCase() as ProposalStatus,
          voting_ends_at: Number(proposal.voting_ends_at),
          voteStatus: {
            approve: {
              voteType: "approve",
              score: proposal.voters_approve.length,
              voters: proposal.voters_approve.map((voter: string) => {
                return {
                  address: voter,
                  image: null,
                  name: "",
                  github: "",
                };
              }),
            },
            reject: {
              voteType: "reject",
              score: proposal.voters_reject.length,
              voters: proposal.voters_reject.map((voter: string) => {
                return {
                  address: voter,
                  image: null,
                  name: "",
                  github: "",
                };
              }),
            },
            abstain: {
              voteType: "abstain",
              score: proposal.voters_abstain.length,
              voters: proposal.voters_abstain.map((voter: string) => {
                return {
                  address: voter,
                  image: null,
                  name: "",
                  github: "",
                };
              }),
            },
          },
        };
      },
    );
    return proposals;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export { getProject, getProjectHash, getProjectFromName, getProposals };
