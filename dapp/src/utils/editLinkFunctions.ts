import type { RepositoryDescriptor } from "../types/repository";
import {
  ensureRepositoryDescriptor,
  getRepositoryConfigUrl,
  getRepositoryReadmeUrl,
  parseRepositoryUrl,
} from "./repository";

export function convertGitHubLink(link: string): string {
  const githubFileRegex =
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/;

  const match = link.match(githubFileRegex);

  if (match) {
    const [, owner, repo, path] = match;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${path}`;
  } else {
    return link;
  }
}

export function getAuthorRepo(repoUrl: string): {
  username: string | undefined;
  repoName: string | undefined;
  descriptor?: RepositoryDescriptor;
} {
  const descriptor = parseRepositoryUrl(repoUrl);
  if (!descriptor) {
    return { username: undefined, repoName: undefined };
  }
  return {
    username: descriptor.owner,
    repoName: descriptor.name,
    descriptor,
  };
}

export function getConfigContentUrlFromRepo(
  repoUrl: string | RepositoryDescriptor,
): string | undefined {
  const descriptor = ensureRepositoryDescriptor(repoUrl);
  if (!descriptor) {
    return undefined;
  }
  return getRepositoryConfigUrl(descriptor);
}

export function getReadmeContentUrlFromRepo(
  repoUrl: string | RepositoryDescriptor,
): string | undefined {
  const descriptor = ensureRepositoryDescriptor(repoUrl);
  if (!descriptor) {
    return undefined;
  }
  return getRepositoryReadmeUrl(descriptor);
}

// Backwards compatibility exports (existing imports expect these names)
export const getGithubContentUrlFromConfigUrl = getConfigContentUrlFromRepo;
export const getGithubContentUrlFromReadmeUrl = getReadmeContentUrlFromRepo;
