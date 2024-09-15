import Versioning from "../contracts/soroban_versioning";
import type { Project } from "soroban_versioning";
import * as pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";

import { loadedProjectId } from "./StateService";

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

export { getProject, getProjectHash, getProjectFromName };
