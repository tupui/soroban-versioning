import type { FormattedCommit } from "../types/github";

interface GitHistoryCommit {
  sha: string;
  authorName: string;
  authorDate: string;
  message: string;
  commitUrl?: string;
}

interface GitCommitDetails {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    author: { name: string; email?: string; date?: string };
    committer: { name: string; email?: string; date?: string };
  };
}

/**
 * Get the Git API endpoint URL.
 * Uses Cloudflare proxy if configured, otherwise uses local API.
 *
 * Environment variable GIT_PROXY_URL can be set to:
 * - "https://git.tansu.dev" (production Cloudflare Worker)
 * - "https://git-testnet.tansu.dev" (testnet Cloudflare Worker)
 * - "" or undefined (use local /api/git endpoint)
 */
function getGitApiUrl(): string {
  // Check for Cloudflare proxy URL from environment
  const proxyUrl = import.meta.env.PUBLIC_GIT_PROXY_URL;
  if (proxyUrl && typeof proxyUrl === "string" && proxyUrl.trim()) {
    return proxyUrl.trim();
  }
  // Default to local API endpoint
  return "/api/git";
}

async function callGitApi<T>(body: Record<string, unknown>): Promise<T> {
  const apiUrl = getGitApiUrl();
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Git API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function groupCommitsByDate(commits: FormattedCommit[]) {
  const grouped = commits.reduce(
    (acc: Record<string, FormattedCommit[]>, commit) => {
      const date = new Date(commit.commit_date).toISOString().split("T")[0];
      if (!date) {
        return acc;
      }
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(commit);
      return acc;
    },
    {},
  );

  return Object.entries(grouped).map(([date, groupedCommits]) => ({
    date,
    commits: groupedCommits as FormattedCommit[],
  }));
}

async function getCommitHistory(
  repoUrl: string,
  page: number = 1,
  perPage: number = 30,
): Promise<{ date: string; commits: FormattedCommit[] }[] | null> {
  if (!repoUrl) {
    return null;
  }

  try {
    const data = await callGitApi<{ commits: GitHistoryCommit[] }>({
      action: "history",
      repoUrl,
      page,
      perPage,
    });

    const formatted = data.commits.map((commit) => ({
      message: commit.message,
      author: {
        name: commit.authorName,
        html_url: "",
      },
      commit_date: commit.authorDate,
      html_url: commit.commitUrl || "",
      sha: commit.sha,
    }));

    return groupCommitsByDate(formatted);
  } catch (error) {
    console.error("Failed to load commit history", error);
    return null;
  }
}

async function getLatestCommitData(
  repoUrl: string,
  sha: string,
): Promise<GitCommitDetails | undefined> {
  if (!repoUrl || !sha) {
    return undefined;
  }

  try {
    const commit = await callGitApi<GitCommitDetails>({
      action: "commit",
      repoUrl,
      sha,
    });
    return commit;
  } catch (error) {
    console.error("Failed to load commit data", error);
    return undefined;
  }
}

async function getLatestCommitHash(
  repoUrl: string,
): Promise<string | undefined> {
  if (!repoUrl) {
    return undefined;
  }

  try {
    const { sha } = await callGitApi<{ sha: string }>({
      action: "latest-hash",
      repoUrl,
    });
    return sha;
  } catch (error) {
    console.error("Failed to load latest commit hash", error);
    return undefined;
  }
}

async function fetchReadmeContentFromConfigUrl(
  repoUrl: string,
): Promise<string | undefined> {
  if (!repoUrl) {
    return undefined;
  }

  try {
    const { content } = await callGitApi<{ content?: string | null }>({
      action: "readme",
      repoUrl,
    });
    return content ?? undefined;
  } catch (error) {
    console.error("Failed to load repository README", error);
    return undefined;
  }
}

export {
  getCommitHistory,
  fetchReadmeContentFromConfigUrl,
  getLatestCommitData,
  getLatestCommitHash,
};
