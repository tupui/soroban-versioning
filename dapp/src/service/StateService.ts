import * as pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";
import type { Project } from "../../packages/tansu";
import type { RepositoryDescriptor } from "../types/repository";
import type { ConfigData } from "../types/projectConfig";
import {
  createRepositoryDescriptor,
  parseRepositoryUrl,
} from "../utils/repository";
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

const projectRepoInfo: {
  descriptor: RepositoryDescriptor | undefined;
} = {
  descriptor: undefined,
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
    projectRepoInfo.descriptor = undefined;
    projectLatestSha.sha = undefined;
    configData = undefined;
    projectRepoInfoStore.set(undefined);
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

function setProjectRepoInfo(
  repository: RepositoryDescriptor | string,
  repoName?: string,
): void {
  let descriptor: RepositoryDescriptor | undefined;

  if (typeof repository !== "string") {
    descriptor = repository;
  } else if (repoName) {
    descriptor = createRepositoryDescriptor({
      host: "github.com",
      owner: repository,
      name: repoName,
    });
  } else {
    descriptor = parseRepositoryUrl(repository) ?? undefined;
  }

  projectRepoInfo.descriptor = descriptor;
  if (typeof window !== "undefined") {
    if (descriptor) {
      projectRepoInfoStore.set({
        descriptor,
        author: descriptor.owner,
        repository: descriptor.name,
      });
    } else {
      projectRepoInfoStore.set(undefined);
    }
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

function loadProjectRepoInfo():
  | { author: string; repository: string; descriptor: RepositoryDescriptor }
  | undefined {
  if (!projectRepoInfo.descriptor) {
    return undefined;
  }
  return {
    author: projectRepoInfo.descriptor.owner,
    repository: projectRepoInfo.descriptor.name,
    descriptor: projectRepoInfo.descriptor,
  };
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
  setProjectRepoInfo,
  loadedProjectId,
  loadProjectInfo,
  loadProjectRepoInfo,
  setProjectLatestSha,
  loadProjectLatestSha,
  loadProjectName,
  setConfigData,
  loadConfigData,
  refreshLocalStorage,
};
