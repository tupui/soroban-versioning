import * as pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";
import type { Project } from "soroban_versioning";

const projectState: {
  project_name: string | undefined;
  project_id: Buffer | undefined;
} = {
  project_name: undefined,
  project_id: undefined,
};

const projectInfo: {
  project_maintainers: string[] | undefined;
  project_config_url: string | undefined;
  project_config_hash: string | undefined;
} = {
  project_maintainers: undefined,
  project_config_url: undefined,
  project_config_hash: undefined,
};

function setProjectId(project_name: string): void {
  projectState.project_name = project_name;
  projectState.project_id = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem('projectState', JSON.stringify({
      project_name: projectState.project_name,
      project_id: projectState.project_id ? projectState.project_id.toString('hex') : undefined,
    }));
  }
}

function setProject(project: Project): void {
  projectInfo.project_maintainers = project.maintainers;
  projectInfo.project_config_url = project.config.url;
  projectInfo.project_config_hash = project.config.hash;
  if (typeof window !== 'undefined') {
    localStorage.setItem('projectInfo', JSON.stringify({
      project_maintainers: projectInfo.project_maintainers,
      project_config_url: projectInfo.project_config_url,
      project_config_hash: projectInfo.project_config_hash,
    }));
  }
}

function loadedProjectId(): Buffer | undefined {
  return projectState.project_id;
}

function loadedProjectInfo(): Project | undefined {
  if (!projectInfo.project_maintainers || !projectInfo.project_config_url || !projectInfo.project_config_hash || !projectState.project_name) {
    return undefined;
  }
  return {
    maintainers: projectInfo.project_maintainers,
    name: projectState.project_name,
    config: {
      url: projectInfo.project_config_url,
      hash: projectInfo.project_config_hash
    }
  };
}

export {
  setProjectId,
  setProject,
  loadedProjectId,
  loadedProjectInfo,
};