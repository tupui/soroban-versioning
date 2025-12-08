import axios from "axios";

import type { FormattedCommit } from "../types/github";
import type { RepositoryDescriptor } from "../types/repository";
import {
  createRepositoryDescriptor,
  ensureRepositoryDescriptor,
  getDefaultBranch,
  getRepositoryReadmeUrlAsync,
  getRepositoryReadmeUrl,
  getRawFileUrlAsync,
  fetchDefaultBranch,
  parseRepositoryUrl,
} from "../utils/repository";

interface CommitHistoryGroup {
  date: string;
  commits: FormattedCommit[];
}

interface ProviderAdapter {
  getCommitHistory?: (
    descriptor: RepositoryDescriptor,
    page?: number,
    perPage?: number,
  ) => Promise<CommitHistoryGroup[] | null>;
  getCommitBySha?: (
    descriptor: RepositoryDescriptor,
    sha: string,
  ) => Promise<any>;
  getLatestCommitHash?: (
    descriptor: RepositoryDescriptor,
  ) => Promise<string | undefined>;
  getReadmeContent?: (
    descriptor: RepositoryDescriptor,
  ) => Promise<string | undefined>;
}

function groupCommitsByDate(
  formattedCommits: FormattedCommit[],
): CommitHistoryGroup[] {
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

  return Object.entries(groupedCommits).map(([date, commits]) => ({
    date,
    commits: commits as FormattedCommit[],
  }));
}

const githubAdapter: ProviderAdapter = {
  async getCommitHistory(descriptor, page = 1, perPage = 30) {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${descriptor.owner}/${descriptor.name}/commits`,
        {
          params: { per_page: perPage, page },
          headers: { Accept: "application/vnd.github.v3+json" },
        },
      );
      const formatted: FormattedCommit[] = response.data.map((commit: any) => ({
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          html_url: commit.author ? commit.author.html_url : "",
        },
        commit_date: commit.commit.author.date,
        html_url: commit.html_url,
        sha: commit.sha,
      }));
      return groupCommitsByDate(formatted);
    } catch {
      return null;
    }
  },

  async getCommitBySha(descriptor, sha) {
    try {
      const url = `https://api.github.com/repos/${descriptor.owner}/${descriptor.name}/commits/${sha}`;
      const response = await fetch(url);

      if (!response.ok) {
        return undefined;
      }

      return await response.json();
    } catch {
      return undefined;
    }
  },

  async getLatestCommitHash(descriptor) {
    try {
      const repoRes = await fetch(
        `https://api.github.com/repos/${descriptor.owner}/${descriptor.name}`,
      );
      if (!repoRes.ok) {
        return undefined;
      }

      const repoData = await repoRes.json();
      const defaultBranch =
        repoData.default_branch ?? getDefaultBranch(descriptor);

      const commitRes = await fetch(
        `https://api.github.com/repos/${descriptor.owner}/${descriptor.name}/commits/${defaultBranch}`,
      );
      if (!commitRes.ok) {
        return undefined;
      }

      const latestCommit = await commitRes.json();
      return latestCommit.sha;
    } catch {
      return undefined;
    }
  },

  async getReadmeContent(descriptor) {
    try {
      // Prefer async URL with default-branch discovery
      const url = await getRepositoryReadmeUrlAsync(descriptor);
      if (!url) {
        return undefined;
      }

      const response = await fetch(url);
      if (!response.ok) {
        return undefined;
      }

      return await response.text();
    } catch {
      return undefined;
    }
  },
};

const fallbackAdapter: ProviderAdapter = {
  async getReadmeContent(descriptor) {
    const url = await getRepositoryReadmeUrlAsync(descriptor);
    if (!url) {
      return undefined;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return undefined;
      }
      return await response.text();
    } catch {
      return undefined;
    }
  },
};

const gitlabAdapter: ProviderAdapter = {
  async getCommitHistory(descriptor, page = 1, perPage = 30) {
    try {
      const projectId = encodeURIComponent(
        `${descriptor.owner}/${descriptor.name}`,
      );
      const res = await axios.get(
        `https://${descriptor.host}/api/v4/projects/${projectId}/repository/commits`,
        { params: { per_page: perPage, page } },
      );
      const commits = res.data as any[];
      const formatted: FormattedCommit[] = commits.map((c) => ({
        message: c.title || c.message || "",
        author: {
          name: c.author_name || c.committer_name || "unknown",
          html_url: `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/-/commit/${c.id}`,
        },
        commit_date: c.committed_date || c.created_at,
        html_url: `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/-/commit/${c.id}`,
        sha: c.id,
      }));
      return groupCommitsByDate(formatted);
    } catch {
      return null;
    }
  },
  async getCommitBySha(descriptor, sha) {
    try {
      const projectId = encodeURIComponent(
        `${descriptor.owner}/${descriptor.name}`,
      );
      const url = `https://${descriptor.host}/api/v4/projects/${projectId}/repository/commits/${sha}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return await res.json();
    } catch {
      return undefined;
    }
  },
  async getLatestCommitHash(descriptor) {
    try {
      const branch = await fetchDefaultBranch(descriptor);
      const projectId = encodeURIComponent(
        `${descriptor.owner}/${descriptor.name}`,
      );
      const url = `https://${descriptor.host}/api/v4/projects/${projectId}/repository/commits/${encodeURIComponent(branch)}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const data = await res.json();
      return data.id as string | undefined;
    } catch {
      return undefined;
    }
  },
  async getReadmeContent(descriptor) {
    try {
      const url = await getRepositoryReadmeUrlAsync(descriptor);
      if (!url) return undefined;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return await res.text();
    } catch {
      return undefined;
    }
  },
};

const forgejoAdapter: ProviderAdapter = {
  async getCommitHistory(descriptor, page = 1, perPage = 30) {
    try {
      const res = await axios.get(
        `https://${descriptor.host}/api/v1/repos/${descriptor.owner}/${descriptor.name}/commits`,
        { params: { page, limit: perPage } },
      );
      const commits = res.data as any[];
      const formatted: FormattedCommit[] = commits.map((c) => ({
        message: c.commit?.message || c.message || "",
        author: {
          name: c.commit?.author?.name || c.author?.login || "unknown",
          html_url: `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/commit/${c.sha}`,
        },
        commit_date:
          c.commit?.author?.date ||
          c.committer?.date ||
          c.created ||
          new Date().toISOString(),
        html_url: `https://${descriptor.host}/${descriptor.owner}/${descriptor.name}/commit/${c.sha}`,
        sha: c.sha,
      }));
      return groupCommitsByDate(formatted);
    } catch {
      return null;
    }
  },
  async getCommitBySha(descriptor, sha) {
    try {
      const url = `https://${descriptor.host}/api/v1/repos/${descriptor.owner}/${descriptor.name}/git/commits/${sha}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return await res.json();
    } catch {
      return undefined;
    }
  },
  async getLatestCommitHash(descriptor) {
    try {
      const branch = await fetchDefaultBranch(descriptor);
      const url = `https://${descriptor.host}/api/v1/repos/${descriptor.owner}/${descriptor.name}/commits/${encodeURIComponent(branch)}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const data = await res.json();
      // For forgejo/gitea, this returns an array when asking branch commits; take first
      const item = Array.isArray(data) ? data[0] : data;
      return item?.sha as string | undefined;
    } catch {
      return undefined;
    }
  },
  async getReadmeContent(descriptor) {
    try {
      const url = await getRepositoryReadmeUrlAsync(descriptor);
      if (!url) return undefined;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return await res.text();
    } catch {
      return undefined;
    }
  },
};

const bitbucketAdapter: ProviderAdapter = {
  async getCommitHistory(descriptor, page = 1, perPage = 30) {
    try {
      const url = `https://api.bitbucket.org/2.0/repositories/${descriptor.owner}/${descriptor.name}/commits`;
      const res = await axios.get(url, { params: { page, pagelen: perPage } });
      const values = res.data?.values || [];
      const formatted: FormattedCommit[] = values.map((c: any) => ({
        message: c.message || "",
        author: {
          name: c.author?.user?.display_name || c.author?.raw || "unknown",
          html_url:
            c.links?.html?.href ||
            `https://bitbucket.org/${descriptor.owner}/${descriptor.name}/commits/${c.hash}`,
        },
        commit_date: c.date,
        html_url:
          c.links?.html?.href ||
          `https://bitbucket.org/${descriptor.owner}/${descriptor.name}/commits/${c.hash}`,
        sha: c.hash,
      }));
      return groupCommitsByDate(formatted);
    } catch {
      return null;
    }
  },
  async getCommitBySha(descriptor, sha) {
    try {
      const url = `https://api.bitbucket.org/2.0/repositories/${descriptor.owner}/${descriptor.name}/commit/${sha}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return await res.json();
    } catch {
      return undefined;
    }
  },
  async getLatestCommitHash(descriptor) {
    try {
      const branch = await fetchDefaultBranch(descriptor);
      const url = `https://api.bitbucket.org/2.0/repositories/${descriptor.owner}/${descriptor.name}/commits/${encodeURIComponent(branch)}`;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const data = await res.json();
      const first = data?.values?.[0];
      return first?.hash as string | undefined;
    } catch {
      return undefined;
    }
  },
  async getReadmeContent(descriptor) {
    try {
      const url = await getRepositoryReadmeUrlAsync(descriptor);
      if (!url) return undefined;
      const res = await fetch(url);
      if (!res.ok) return undefined;
      return await res.text();
    } catch {
      return undefined;
    }
  },
};

function resolveAdapter(descriptor: RepositoryDescriptor): ProviderAdapter {
  switch (descriptor.provider) {
    case "github":
      return githubAdapter;
    case "gitlab":
      return gitlabAdapter;
    case "forgejo":
      return forgejoAdapter;
    case "bitbucket":
      return bitbucketAdapter;
    default:
      return fallbackAdapter;
  }
}

function resolveDescriptor(
  ownerOrDescriptor: string | RepositoryDescriptor,
  repoName?: string,
): RepositoryDescriptor | undefined {
  if (typeof ownerOrDescriptor !== "string") {
    return ownerOrDescriptor;
  }

  if (repoName) {
    return createRepositoryDescriptor({
      host: "github.com",
      owner: ownerOrDescriptor,
      name: repoName,
    });
  }

  return parseRepositoryUrl(ownerOrDescriptor);
}

export async function getCommitHistory(
  ownerOrDescriptor: string | RepositoryDescriptor,
  repoName?: string,
  page: number = 1,
  perPage: number = 30,
): Promise<CommitHistoryGroup[] | null> {
  const descriptor = resolveDescriptor(ownerOrDescriptor, repoName);
  if (!descriptor) {
    return null;
  }

  const adapter = resolveAdapter(descriptor);
  if (!adapter.getCommitHistory) {
    return null;
  }

  return adapter.getCommitHistory(descriptor, page, perPage);
}

export async function getLatestCommitData(
  repository: string | RepositoryDescriptor,
  sha: string,
): Promise<any> {
  const descriptor = ensureRepositoryDescriptor(repository);
  if (!descriptor) {
    return undefined;
  }

  const adapter = resolveAdapter(descriptor);
  if (!adapter.getCommitBySha) {
    return undefined;
  }

  return adapter.getCommitBySha(descriptor, sha);
}

export async function getLatestCommitHash(
  repository: string | RepositoryDescriptor,
): Promise<string | undefined> {
  const descriptor = ensureRepositoryDescriptor(repository);
  if (!descriptor) {
    return undefined;
  }

  const adapter = resolveAdapter(descriptor);
  if (!adapter.getLatestCommitHash) {
    return undefined;
  }

  return adapter.getLatestCommitHash(descriptor);
}

export async function fetchReadmeContentFromConfigUrl(
  repository: string | RepositoryDescriptor,
): Promise<string | undefined> {
  const descriptor = ensureRepositoryDescriptor(repository);
  if (!descriptor) {
    return undefined;
  }

  const adapter = resolveAdapter(descriptor);
  if (!adapter.getReadmeContent) {
    return undefined;
  }

  return adapter.getReadmeContent(descriptor);
}
