import axios from "axios";
import toml from "toml";

import type { FormattedCommit } from "../types/github";
import {
  getAuthorRepo,
  getGithubContentUrlFromConfigUrl,
  getGithubContentUrlFromReadmeUrl,
} from "../utils/editLinkFunctions";

async function getCommitHistory(
  username: string,
  repo: string,
  page: number = 1,
  perPage: number = 30,
): Promise<{ date: string; commits: FormattedCommit[] }[]> {
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
}

async function fetchTOMLFromConfigUrl(configUrl: string) {
  const url = getGithubContentUrlFromConfigUrl(configUrl);
  if (url) {
    const response = await fetch(url);
    if (!response.ok) {
      return undefined;
    }
    const tomlText = await response.text();
    return toml.parse(tomlText);
  }
  return undefined;
}

async function getTOMLFileHash(configUrl: string) {
  const url = getGithubContentUrlFromConfigUrl(configUrl);

  if (url) {
    const response = await fetch(url);

    if (!response.ok) {
      return undefined;
    }

    let tomlText = await response.text();

    const encoder = new TextEncoder();
    const tomlBytes = encoder.encode(tomlText);

    const hashBuffer = await crypto.subtle.digest("SHA-256", tomlBytes);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return undefined;
}

async function getCommitDataFromSha(
  owner: string,
  repo: string,
  sha: string,
): Promise<any> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  const response = await fetch(url);

  if (!response.ok) {
    return undefined;
  }

  return await response.json();
}

async function getLatestCommitData(
  configUrl: string,
  sha: string,
): Promise<any> {
  const { username, repoName } = getAuthorRepo(configUrl);
  if (!username || !repoName) {
    return undefined;
  }

  return await getCommitDataFromSha(username, repoName, sha);
}

async function getLatestCommitHash(
  configUrl: string,
): Promise<string | undefined> {
  const token = import.meta.env.PUBLIC_GITHUBTOKEN;

  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      }
    : {};
  const { username, repoName } = getAuthorRepo(configUrl);
  if (!username || !repoName) {
    return undefined;
  }

  try {
    const repoRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}`,
      {
        headers,
      },
    );
    if (!repoRes.ok)
      throw new Error(`Failed to fetch repo info: ${repoRes.status}`);
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch;

    const commitRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/commits/${defaultBranch}`,
      {
        headers,
      },
    );
    if (!commitRes.ok)
      throw new Error(`Failed to fetch latest commit: ${commitRes.status}`);
    const latestCommit = await commitRes.json();
    const latestSha = latestCommit.sha;
    return latestSha;
  } catch (error: any) {
    console.error("Error fetching latest commit:", error);
    throw new Error(error.message);
  }
}

async function fetchReadmeContentFromConfigUrl(configUrl: string) {
  const url = getGithubContentUrlFromReadmeUrl(configUrl);

  if (url) {
    const response = await fetch(url);

    if (!response.ok) {
      return undefined;
    }

    const tomlText = await response.text();

    return tomlText;
  }

  return undefined;
}

export {
  getCommitHistory,
  fetchTOMLFromConfigUrl,
  fetchReadmeContentFromConfigUrl,
  getTOMLFileHash,
  getLatestCommitData,
  getLatestCommitHash,
};
