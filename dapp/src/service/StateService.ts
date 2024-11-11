import * as pkg from "js-sha3";

const { keccak256 } = pkg;
import { Buffer } from "buffer";
import type { Project } from "soroban_versioning";
import type { ConfigData } from "@types/projectConfig";

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

const projectRepoInfo: {
  project_author: string | undefined;
  project_repository: string | undefined;
} = {
  project_author: undefined,
  project_repository: undefined,
};

const projectLatestSha: {
  sha: string | undefined;
} = {
  sha: undefined,
};

// Add this new type definition

// Add this new state variable
let configData: ConfigData | undefined = undefined;

function initializeProjectState() {
  if (typeof window !== "undefined") {
    const storedState = localStorage.getItem("projectState");
    if (
      storedState &&
      projectState.project_name === undefined &&
      projectState.project_id === undefined
    ) {
      const parsedState = JSON.parse(storedState);
      projectState.project_name = parsedState.project_name;
      projectState.project_id = parsedState.project_id
        ? Buffer.from(parsedState.project_id, "hex")
        : undefined;
    }

    const storedInfo = localStorage.getItem("projectInfo");
    if (
      storedInfo &&
      projectInfo.project_config_hash === undefined &&
      projectInfo.project_config_url === undefined &&
      projectInfo.project_maintainers === undefined
    ) {
      const parsedInfo = JSON.parse(storedInfo);
      projectInfo.project_maintainers = parsedInfo.project_maintainers;
      projectInfo.project_config_url = parsedInfo.project_config_url;
      projectInfo.project_config_hash = parsedInfo.project_config_hash;
    }

    const storedRepoInfo = localStorage.getItem("projectRepoInfo");
    if (
      storedRepoInfo &&
      projectRepoInfo.project_author === undefined &&
      projectRepoInfo.project_repository === undefined
    ) {
      const parsedRepoInfo = JSON.parse(storedRepoInfo);
      projectRepoInfo.project_author = parsedRepoInfo.project_author;
      projectRepoInfo.project_repository = parsedRepoInfo.project_repository;
    }

    const storedLatestSha = localStorage.getItem("projectLatestSha");
    if (storedLatestSha && projectLatestSha.sha === undefined) {
      const parsedLatestSha = JSON.parse(storedLatestSha);
      projectLatestSha.sha = parsedLatestSha.sha;
    }

    // Add this new initialization
    const storedConfigData = localStorage.getItem("configData");
    if (storedConfigData) {
      configData = JSON.parse(storedConfigData);
    }
  }
}

function refreshLocalStorage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("projectState");
    localStorage.removeItem("projectInfo");
    localStorage.removeItem("projectRepoInfo");
    localStorage.removeItem("projectLatestSha");
    localStorage.removeItem("configData");

    projectState.project_name = undefined;
    projectState.project_id = undefined;
    projectInfo.project_maintainers = undefined;
    projectInfo.project_config_url = undefined;
    projectInfo.project_config_hash = undefined;
    projectRepoInfo.project_author = undefined;
    projectRepoInfo.project_repository = undefined;
    projectLatestSha.sha = undefined;
    configData = undefined;
  }
}

function setProjectId(project_name: string): void {
  projectState.project_name = project_name;
  projectState.project_id = Buffer.from(
    keccak256.create().update(project_name).digest(),
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "projectState",
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
  projectInfo.project_config_hash = project.config.hash;
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "projectInfo",
      JSON.stringify({
        project_maintainers: projectInfo.project_maintainers,
        project_config_url: projectInfo.project_config_url,
        project_config_hash: projectInfo.project_config_hash,
      }),
    );
  }
}

function setProjectRepoInfo(author: string, repository: string): void {
  projectRepoInfo.project_author = author;
  projectRepoInfo.project_repository = repository;
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "projectRepoInfo",
      JSON.stringify({
        project_author: projectRepoInfo.project_author,
        project_repository: projectRepoInfo.project_repository,
      }),
    );
  }
}

function setProjectLatestSha(sha: string): void {
  projectLatestSha.sha = sha;
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "projectLatestSha",
      JSON.stringify({
        sha: projectLatestSha.sha,
      }),
    );
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
    localStorage.setItem("configData", JSON.stringify(configData));
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
    !projectInfo.project_config_hash ||
    !projectState.project_name
  ) {
    return undefined;
  }
  return {
    maintainers: projectInfo.project_maintainers,
    name: projectState.project_name,
    config: {
      url: projectInfo.project_config_url,
      hash: projectInfo.project_config_hash,
    },
  };
}

function loadProjectRepoInfo():
  | { author: string; repository: string }
  | undefined {
  if (!projectRepoInfo.project_author || !projectRepoInfo.project_repository) {
    return undefined;
  }
  return {
    author: projectRepoInfo.project_author,
    repository: projectRepoInfo.project_repository,
  };
}

function loadProjectLatestSha(): string | undefined {
  return projectLatestSha.sha;
}

function loadConfigData(): ConfigData | undefined {
  return configData;
}

export {
  initializeProjectState,
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
