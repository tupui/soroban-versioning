import Versioning from "../contracts/soroban_versioning";
import * as pkg from "js-sha3";
const { keccak256 } = pkg;
import { Buffer } from "buffer";
import { loadedProjectId } from "./StateService";
import { modifyProposalFromContract } from "utils/utils";
import type { Project, Proposal } from "soroban_versioning";
import type { Proposal as ModifiedProposal } from "types/proposal";
import type { Response } from "types/response";
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

async function getProjectHash(): Promise<Response<string>> {
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    return {
      data: null,
      error: true,
      errorCode: -1,
      errorMessage: "No project defined",
    };
  }
  try {
    const res = await Versioning.get_commit({
      project_key: projectId,
    });
    return { data: res.result, error: false, errorCode: -1, errorMessage: "" };
  } catch (e: any) {
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: null, error: true, errorCode, errorMessage };
  }
}

async function getProject(): Promise<Response<Project>> {
  const projectId = loadedProjectId();

  if (projectId === undefined) {
    return {
      data: null,
      error: true,
      errorCode: -1,
      errorMessage: "No project defined",
    };
  }
  try {
    const res = await Versioning.get_project({
      project_key: projectId,
    });
    return { data: res.result, error: false, errorCode: -1, errorMessage: "" };
  } catch (e: any) {
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: null, error: true, errorCode, errorMessage };
  }
}

async function getProjectFromName(
  projectName: string,
): Promise<Response<Project>> {
  const projectId = Buffer.from(
    keccak256.create().update(projectName).digest(),
  );

  if (projectId === undefined) {
    return {
      data: null,
      error: true,
      errorCode: -1,
      errorMessage: "No project defined",
    };
  }
  try {
    const res = await Versioning.get_project({
      project_key: projectId,
    });
    return { data: res.result, error: false, errorCode: -1, errorMessage: "" };
  } catch (e: any) {
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: null, error: true, errorCode, errorMessage };
  }
}

async function getProjectFromId(projectId: Buffer): Promise<Response<Project>> {
  try {
    const res = await Versioning.get_project({
      project_key: projectId,
    });
    return { data: res.result, error: false, errorCode: -1, errorMessage: "" };
  } catch (e: any) {
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: null, error: true, errorCode, errorMessage };
  }
}

async function getProposals(
  project_name: string,
  page: number,
): Promise<Response<ModifiedProposal[]>> {
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
    return { data: proposals, error: false, errorCode: -1, errorMessage: "" };
  } catch (e: any) {
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: null, error: true, errorCode, errorMessage };
  }
}

async function getProposal(
  projectName: string,
  proposalId: number,
): Promise<Response<ModifiedProposal | null>> {
  const project_key = Buffer.from(
    keccak256.create().update(projectName).digest(),
  );
  try {
    const res = await Versioning.get_proposal({
      project_key: project_key,
      proposal_id: proposalId,
    });

    const proposal: Proposal = res.result;
    return {
      data: modifyProposalFromContract(proposal),
      error: false,
      errorCode: -1,
      errorMessage: "",
    };
  } catch (e: any) {
    const { errorCode, errorMessage } = fetchErrorCode(e);
    return { data: null, error: true, errorCode, errorMessage };
  }
}

export {
  getProject,
  getProjectHash,
  getProjectFromName,
  getProjectFromId,
  getProposals,
  getProposal,
};
