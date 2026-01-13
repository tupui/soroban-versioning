import * as pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";
import type { Project } from "../../packages/tansu";
import type { ConfigData } from "../types/projectConfig";
import { projectState as projectStateStore } from "utils/store";
import { projectInfo as projectInfoStore } from "utils/store";
import { projectRepoInfo as projectRepoInfoStore } from "utils/store";
import { projectLatestSha as projectLatestShaStore } from "utils/store";
import { configData as configDataStore } from "utils/store";

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
  project_config_ipfs: string | undefined;
} = {
  project_maintainers: undefined,
  project_config_url: undefined,
  project_config_ipfs: undefined,
};

const projectRepo: {
  project_url: string | undefined;
} = {
  project_url: undefined,
};

const projectLatestSha: {
  sha: string | undefined;
} = {
  sha: undefined,
};

// Add this new type definition

// Add this new state variable
let configData: ConfigData | undefined = undefined;

function refreshLocalStorage(): void {
  if (typeof window !== "undefined") {
    projectState.project_name = undefined;
    projectState.project_id = undefined;
    projectInfo.project_maintainers = undefined;
    projectInfo.project_config_url = undefined;
    projectInfo.project_config_ipfs = undefined;
    projectRepo.project_url = undefined;
    projectLatestSha.sha = undefined;
    configData = undefined;
  }
}

function setProjectId(project_name: string): void {
  projectState.project_name = project_name;
  projectState.project_id = Buffer.from(
    keccak256.create().update(project_name.toLowerCase()).digest(),
  );
  if (typeof window !== "undefined") {
    projectStateStore.set(
      JSON.stringify({
        project_name: projectState.project_name,
        project_id: projectState.project_id
          ? projectState.project_id.toString("hex")
          : undefined,
      }),
    );
  }
}

function setProject(project: Project): void {
  projectInfo.project_maintainers = project.maintainers;
  projectInfo.project_config_url = project.config.url;
  projectInfo.project_config_ipfs = project.config.ipfs;
  if (typeof window !== "undefined") {
    projectInfoStore.set(projectInfo);
  }
}

function setProjectRepoUrl(url: string): void {
  projectRepo.project_url = url;
  if (typeof window !== "undefined") {
    projectRepoInfoStore.set(projectRepo);
  }
}

function setProjectLatestSha(sha: string): void {
  projectLatestSha.sha = sha;
  if (typeof window !== "undefined") {
    projectLatestShaStore.set(projectLatestSha);
  }
}

function setConfigData(data: Partial<ConfigData>): void {
  if (!configData) {
    configData = data as ConfigData;
  } else {
    configData = {
      ...configData,
      ...data,
    };
  }
  if (typeof window !== "undefined") {
    configDataStore.set(configData);
  }
}

function loadedProjectId(): Buffer | undefined {
  return projectState.project_id;
}

function loadProjectName(): string | undefined {
  return projectState.project_name;
}

function loadProjectInfo(): Project | undefined {
  if (
    !projectInfo.project_maintainers ||
    !projectInfo.project_config_url ||
    !projectInfo.project_config_ipfs ||
    !projectState.project_name
  ) {
    return undefined;
  }
  return {
    maintainers: projectInfo.project_maintainers,
    name: projectState.project_name,
    config: {
      url: projectInfo.project_config_url,
      ipfs: projectInfo.project_config_ipfs,
    },
  };
}

function loadProjectRepoUrl(): string | undefined {
  return projectRepo.project_url;
}

function loadProjectLatestSha(): string | undefined {
  return projectLatestSha.sha;
}

function loadConfigData(): ConfigData | undefined {
  return configData;
}

export {
  setProjectId,
  setProject,
  setProjectRepoUrl,
  loadedProjectId,
  loadProjectInfo,
  loadProjectRepoUrl,
  setProjectLatestSha,
  loadProjectLatestSha,
  loadProjectName,
  setConfigData,
  loadConfigData,
  refreshLocalStorage,
};
