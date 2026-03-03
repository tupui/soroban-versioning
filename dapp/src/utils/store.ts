import { atom } from "nanostores";
import type { ConfigData } from "../types/projectConfig";

export type ProjectStateSerialized = string | undefined;

export interface ProjectInfoValue {
  project_maintainers?: string[];
  project_config_url?: string;
  project_config_ipfs?: string;
}

export interface ProjectRepoInfoValue {
  project_author?: string;
  project_repository?: string;
}

export interface ProjectLatestShaValue {
  sha?: string;
}

export const projectInfoLoaded = atom<boolean>(false);

/** True when the current project has sub-projects (organization view). Used to hide commit hash UI. */
export const projectHasSubProjects = atom<boolean>(false);
export const latestCommit = atom<string>("");
export const projectCardModalOpen = atom<boolean>(false);
export const connectedPublicKey = atom<string>("");
export const projectState = atom<ProjectStateSerialized>(undefined);
export const projectInfo = atom<ProjectInfoValue | undefined>(undefined);
export const projectRepoInfo = atom<ProjectRepoInfoValue | undefined>(
  undefined,
);
export const projectLatestSha = atom<ProjectLatestShaValue | undefined>(
  undefined,
);
export const configData = atom<ConfigData | undefined>(undefined);
