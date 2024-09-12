import Versioning from "../contracts/soroban_versioning";
import type { Project } from "soroban_versioning";

import {loadedProjectId} from "./StateService";

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

export {
  getProject,
  getProjectHash,
};