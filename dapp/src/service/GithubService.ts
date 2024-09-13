import axios from 'axios';
import toml from 'toml';

import type { FormattedCommit } from '../types/github';
import { getGithubContentUrl, getGithubContentUrlFromConfigUrl } from '../utils/editLinkFunctions';

async function getCommitHistory(username: string, repo: string, perPage: number = 30, page: number = 1): Promise<{ date: string; commits: FormattedCommit[] }[]> {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/commits`,
      {
        params: { per_page: perPage, page: page },
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      }
    );

    const formattedCommits = response.data.map((commit: any) => ({
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        html_url: commit.author ? commit.author.html_url : '',
      },
      commit_date: commit.commit.author.date,
      html_url: commit.html_url,
      sha: commit.sha,
    }));

    // Group commits by date
    const groupedCommits = formattedCommits.reduce((acc: Record<string, FormattedCommit[]>, commit: FormattedCommit) => {
      const date = new Date(commit.commit_date).toISOString().split('T')[0];
      if (!date) {
        return acc;
      }
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(commit);
      return acc;
    }, {});

    // Convert grouped commits to array format
    return Object.entries(groupedCommits).map(([date, commits]) => ({
      date,
      commits: commits as FormattedCommit[],
    }));
  } catch (error) {
    console.error('Error fetching commit history:', error);
    throw error;
  }
}

async function fetchTOML(username: string, repo: string) {
  try {
    const url = getGithubContentUrl(username, repo, 'main/tansu.toml');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching the TOML file: ${response.statusText}`);
    }

    const tomlText = await response.text();

    const parsedData = toml.parse(tomlText);

    return parsedData;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function fetchTOMLFromConfigUrl(configUrl: string) {
  try {
    const url = getGithubContentUrlFromConfigUrl(configUrl);

    if (url) {
      const response = await fetch(url);
  
      if (!response.ok) {
        throw new Error(`Error fetching the TOML file: ${response.statusText}`);
      }
  
      const tomlText = await response.text();
  
      const parsedData = toml.parse(tomlText);
      return parsedData;
    }

    return undefined;

  } catch (error) {
    console.error('Error:', error);
  }
}

export {
  getCommitHistory,
  fetchTOML,
  fetchTOMLFromConfigUrl,
};
