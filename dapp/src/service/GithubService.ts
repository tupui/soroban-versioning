import axios from "axios";

import type { FormattedCommit } from "../types/github";
import {
  getAuthorRepo,
  getGithubContentUrlFromReadmeUrl,
} from "../utils/editLinkFunctions";

async function getCommitHistory(
  username: string,
  repo: string,
  page: number = 1,
  perPage: number = 30,
): Promise<{ date: string; commits: FormattedCommit[] }[] | null> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/commits`,
      {
        params: { per_page: perPage, page: page },
        headers: { Accept: "application/vnd.github.v3+json" },
      },
    );

    const formattedCommits = response.data.map((commit: any) => ({
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        html_url: commit.author ? commit.author.html_url : "",
      },
      commit_date: commit.commit.author.date,
      html_url: commit.html_url,
      sha: commit.sha,
    }));

    // Group commits by date
    const groupedCommits = formattedCommits.reduce(
      (acc: Record<string, FormattedCommit[]>, commit: FormattedCommit) => {
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

    // Convert grouped commits to array format
    return Object.entries(groupedCommits).map(([date, commits]) => ({
      date,
      commits: commits as FormattedCommit[],
    }));
  } catch {
    // Don't show error toast as this may be an expected condition
    // (e.g., repository is private or doesn't exist)
    return null;
  }
}

async function getCommitDataFromSha(
  owner: string,
  repo: string,
  sha: string,
): Promise<any> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
    const response = await fetch(url);

    if (!response.ok) {
      // Expected condition (commit may not exist)
      return undefined;
    }

    return await response.json();
  } catch {
    // Don't show error toast as this may be an expected condition
    return undefined;
  }
}

async function getLatestCommitData(
  configUrl: string,
  sha: string,
): Promise<any> {
  const { username, repoName } = getAuthorRepo(configUrl);
  if (!username || !repoName) {
    // Expected condition (URL may be malformed)
    return undefined;
  }

  return await getCommitDataFromSha(username, repoName, sha);
}

async function getLatestCommitHash(
  configUrl: string,
): Promise<string | undefined> {
  const { username, repoName } = getAuthorRepo(configUrl);
  if (!username || !repoName) {
    // Expected condition (URL may be malformed)
    return undefined;
  }

  try {
    const repoRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}`,
    );
    if (!repoRes.ok) {
      // Expected condition (repo may not exist or be private)
      return undefined;
    }

    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch;

    const commitRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/commits/${defaultBranch}`,
    );
    if (!commitRes.ok) {
      // Expected condition (branch may not exist)
      return undefined;
    }

    const latestCommit = await commitRes.json();
    const latestSha = latestCommit.sha;
    return latestSha;
  } catch {
    // Don't show error toast as these are often expected conditions
    return undefined;
  }
}

async function fetchReadmeContentFromConfigUrl(configUrl: string) {
  try {
    const url = getGithubContentUrlFromReadmeUrl(configUrl);

    if (url) {
      const response = await fetch(url);

      if (!response.ok) {
        // Expected condition (readme may not exist)
        return undefined;
      }

      const tomlText = await response.text();
      return tomlText;
    }

    return undefined;
  } catch {
    // Don't show error toast as this may be an expected condition
    return undefined;
  }
}

export {
  getCommitHistory,
  fetchReadmeContentFromConfigUrl,
  getLatestCommitData,
  getLatestCommitHash,
};
