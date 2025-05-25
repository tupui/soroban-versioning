import Tansu from "../contracts/soroban_tansu";
import * as pkg from "js-sha3";
const { keccak256 } = pkg;
import { Buffer } from "buffer";
import { loadedProjectId } from "./StateService";
import { modifyProposalFromContract } from "utils/utils";
import type { Project, Proposal, Member, Badges } from "../../packages/tansu";
import type { Proposal as ModifiedProposal } from "types/proposal";
import {
  contractErrorMessages,
  type ContractErrorMessageKey,
} from "constants/contractErrorMessages";

function fetchErrorCode(error: any): {
  errorCode: ContractErrorMessageKey;
  errorMessage: string;
} {
  const errorCodeMatch = /Error\(Contract, #(\d+)\)/.exec(error.message);
  let errorCode: ContractErrorMessageKey = 0;
  if (errorCodeMatch && errorCodeMatch[1]) {
    errorCode = parseInt(errorCodeMatch[1], 10) as ContractErrorMessageKey;
  }
  return { errorCode, errorMessage: contractErrorMessages[errorCode] };
}

async function getProjectHash(): Promise<string> {
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    throw new Error("No project defined");
  }
  try {
    const res = await Tansu.get_commit({
      project_key: projectId,
    });
    return res.result;
  } catch (e: any) {
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function getProject(): Promise<Project> {
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    throw new Error("No project defined");
  }
  try {
    const res = await Tansu.get_project({
      project_key: projectId,
    });
    return res.result;
  } catch (e: any) {
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function getProjectFromName(projectName: string): Promise<Project> {
  const projectId = Buffer.from(
    keccak256.create().update(projectName.toLowerCase()).digest(),
  );

  if (projectId === undefined) {
    throw new Error("No project defined");
  }
  try {
    const res = await Tansu.get_project({
      project_key: projectId,
    });
    return res.result;
  } catch (e: any) {
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function getProjectFromId(projectId: Buffer): Promise<Project> {
  try {
    const res = await Tansu.get_project({
      project_key: projectId,
    });
    return res.result;
  } catch (e: any) {
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function getProposalPages(project_name: string) {
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );

  const checkPageExist = async (page: number) => {
    const res = await Tansu.get_dao({
      project_key,
      page,
    });
    return res.result.proposals.length > 0;
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
}

async function getProposals(
  project_name: string,
  page: number,
): Promise<ModifiedProposal[]> {
  const project_key = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );
  try {
    const res = await Tansu.get_dao({
      project_key: project_key,
      page: page,
    });

    const proposals: ModifiedProposal[] = res.result.proposals.map(
      (proposal: Proposal) => {
        return modifyProposalFromContract(proposal);
      },
    );
    return proposals;
  } catch (e: any) {
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function getProposal(
  projectName: string,
  proposalId: number,
): Promise<ModifiedProposal> {
  const project_key = Buffer.from(
    keccak256.create().update(projectName).digest(),
  );
  try {
    const res = await Tansu.get_proposal({
      project_key: project_key,
      proposal_id: proposalId,
    });

    const proposal: Proposal = res.result;
    return modifyProposalFromContract(proposal);
  } catch (e: any) {
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
  }
}

async function getMember(memberAddress: string): Promise<Member> {
  try {
    const res = await Tansu.get_member({
      member_address: memberAddress,
    });
    return res.result;
  } catch (e: any) {
    const { errorMessage, errorCode } = fetchErrorCode(e);
    // If unknown member error (18), propagate with specific code to caller
    throw { message: errorMessage, code: errorCode };
  }
}

async function getBadges(): Promise<Badges> {
  const projectId = loadedProjectId();
  if (!projectId) throw new Error("No project defined");
  try {
    const res = await Tansu.get_badges({ key: projectId });
    return res.result;
  } catch (e: any) {
    const { errorMessage } = fetchErrorCode(e);
    throw new Error(errorMessage);
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
