export function convertGitHubLink(link: string | null | undefined): string {
  if (link == null || typeof link !== "string") return "";
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

export function getGithubContentUrl(
  username: string,
  repoName: string,
  filePath: string,
): string {
  return `https://raw.githubusercontent.com/${username}/${repoName}/${filePath}`;
}

export function getAuthorRepo(repoUrl: string | null | undefined): {
  username: string | undefined;
  repoName: string | undefined;
} {
  if (repoUrl == null || typeof repoUrl !== "string") {
    return { username: undefined, repoName: undefined };
  }
  const match = repoUrl.match(/https\:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match || !match[1] || !match[2])
    return { username: undefined, repoName: undefined };
  return { username: match[1], repoName: match[2] };
}

export function getGithubContentUrlFromConfigUrl(
  configUrl: string | null | undefined,
): string | undefined {
  const { username, repoName } = getAuthorRepo(configUrl);
  if (username && repoName) {
    return getGithubContentUrl(username, repoName, "master/tansu.toml");
  }
  return undefined;
}

export function getGithubContentUrlFromReadmeUrl(
  configUrl: string | null | undefined,
): string | undefined {
  const { username, repoName } = getAuthorRepo(configUrl);
  if (username && repoName) {
    return getGithubContentUrl(username, repoName, "master/README.md");
  }
  return undefined;
}
