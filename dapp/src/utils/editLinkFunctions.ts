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

export function getGithubContentUrl(
  username: string,
  repoName: string,
  filePath: string,
): string {
  return `https://raw.githubusercontent.com/${username}/${repoName}/${filePath}`;
}

export function getGithubContentLink(
  username: string,
  repoName: string,
  filePath: string,
): string {
  return `https://github.com/${username}/${repoName}/blob/${filePath}`;
}

export function getAuthorRepo(repoUrl: string): {
  username: string | undefined;
  repoName: string | undefined;
} {
  const match = repoUrl.match(/https\:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match || !match[1] || !match[2])
    return { username: undefined, repoName: undefined };
  return { username: match[1], repoName: match[2] };
}

export function getGithubContentUrlFromConfigUrl(
  configUrl: string,
): string | undefined {
  const { username, repoName } = getAuthorRepo(configUrl);
  if (username && repoName) {
    // use master as GitHub will do an automatic redirection to main
    return getGithubContentUrl(username, repoName, "master/tansu.toml");
  }
  return undefined;
}

export function getGithubContentLinkFromConfigUrl(
  configUrl: string,
  filePath: string,
): string {
  return `${configUrl}/blob/${filePath}`;
}
