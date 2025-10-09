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
} {
  try {
    if (repoUrl.startsWith("git@")) {
      const [, path] = repoUrl.split(":");
      if (!path) {
        return { username: undefined, repoName: undefined };
      }
      const segments = path
        .replace(/\.git$/, "")
        .split("/")
        .filter(Boolean);
      if (segments.length < 2) {
        return { username: undefined, repoName: undefined };
      }
      const repoName = segments.pop();
      const username = segments.pop();
      return { username, repoName };
    }

    const url = new URL(repoUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return { username: undefined, repoName: undefined };
    }

    const repoName = segments.pop()?.replace(/\.git$/, "");
    const username = segments.pop();
    return { username, repoName };
  } catch {
    return { username: undefined, repoName: undefined };
  }
}
