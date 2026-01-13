/**
 * Cloudflare Worker for Git Proxy
 *
 * This worker proxies requests to various Git hosting providers' APIs.
 * It provides a unified interface for fetching commit data from
 * GitHub, GitLab, Bitbucket, Codeberg, and other Git hosts.
 *
 * SECURITY: Uses an allow list for Git hosts and CORS for origins.
 */

export interface Env {
  // Optional: GitHub token for higher rate limits
  GITHUB_TOKEN?: string;
  // Optional: GitLab token for private repos
  GITLAB_TOKEN?: string;
  // Optional: Additional allowed hosts (comma-separated)
  EXTRA_GIT_HOSTS?: string;
}

/**
 * Allow list of trusted git hosting domains.
 * Only repositories from these domains will be proxied.
 */
const ALLOWED_GIT_HOSTS = new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "codeberg.org",
  "sr.ht",
  "gitea.com",
  "git.sr.ht",
]);

const ALLOWED_ORIGINS = [
  "http://localhost:4321",
  "https://testnet.tansu.dev",
  "https://app.tansu.dev",
  "https://tansu.xlm.sh",
  "https://deploy-preview-*--staging-tansu.netlify.app",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};

  const isAllowed = ALLOWED_ORIGINS.some(
    (allowed) =>
      allowed === origin ||
      (allowed.includes("*") &&
        new RegExp(`^${allowed.replace(/\*/g, ".*")}$`).test(origin)),
  );

  if (!isAllowed) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function getAllowedHosts(env: Env): Set<string> {
  const hosts = new Set(ALLOWED_GIT_HOSTS);
  if (env.EXTRA_GIT_HOSTS) {
    env.EXTRA_GIT_HOSTS.split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
      .forEach((h) => hosts.add(h));
  }
  return hosts;
}

function validateRepoUrl(repoUrl: string, allowedHosts: Set<string>): URL {
  const trimmed = repoUrl.trim();

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (allowedHosts.has(host)) {
      return url;
    }
    throw new Error(
      `Repository host "${host}" not allowed. Allowed hosts: ${Array.from(allowedHosts).join(", ")}`,
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes("not allowed")) {
      throw e;
    }
    throw new Error("Invalid repository URL format");
  }
}

function normalizeRepoUrl(repoUrl: string): string {
  let normalized = repoUrl.trim();
  if (normalized.endsWith(".git")) {
    normalized = normalized.slice(0, -4);
  }
  if (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function parseRepoPath(url: URL): { owner: string; repo: string } {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Invalid repository path");
  }
  return { owner: parts[0], repo: parts[1].replace(".git", "") };
}

interface GitCommit {
  sha: string;
  authorName: string;
  authorDate: string;
  authorEmail: string;
  committerName: string;
  committerDate: string;
  committerEmail: string;
  message: string;
  commitUrl: string;
}

interface GitHostHandler {
  getCommitHistory(
    owner: string,
    repo: string,
    page: number,
    perPage: number,
    env: Env,
  ): Promise<GitCommit[]>;
  getCommitDetails(
    owner: string,
    repo: string,
    sha: string,
    env: Env,
  ): Promise<GitCommit | null>;
  getLatestCommitHash(owner: string, repo: string, env: Env): Promise<string>;
  getReadmeContent(
    owner: string,
    repo: string,
    env: Env,
  ): Promise<string | null>;
}

// GitHub API handler
const githubHandler: GitHostHandler = {
  async getCommitHistory(owner, repo, page, perPage, env) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Tansu-Git-Proxy/1.0",
    };
    if (env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`,
      { headers },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as any[];
    return data.map((commit: any) => ({
      sha: commit.sha,
      authorName: commit.commit.author.name,
      authorDate: commit.commit.author.date,
      authorEmail: commit.commit.author.email,
      committerName: commit.commit.committer.name,
      committerDate: commit.commit.committer.date,
      committerEmail: commit.commit.committer.email,
      message: commit.commit.message,
      commitUrl: commit.html_url,
    }));
  },

  async getCommitDetails(owner, repo, sha, env) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Tansu-Git-Proxy/1.0",
    };
    if (env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      { headers },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commit = (await response.json()) as any;
    return {
      sha: commit.sha,
      authorName: commit.commit.author.name,
      authorDate: commit.commit.author.date,
      authorEmail: commit.commit.author.email,
      committerName: commit.commit.committer.name,
      committerDate: commit.commit.committer.date,
      committerEmail: commit.commit.committer.email,
      message: commit.commit.message,
      commitUrl: commit.html_url,
    };
  },

  async getLatestCommitHash(owner, repo, env) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Tansu-Git-Proxy/1.0",
    };
    if (env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
      { headers },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as any[];
    if (data.length === 0) {
      throw new Error("No commits found");
    }
    return data[0].sha;
  },

  async getReadmeContent(owner, repo, env) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "Tansu-Git-Proxy/1.0",
    };
    if (env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.text();
  },
};

// GitLab API handler
const gitlabHandler: GitHostHandler = {
  async getCommitHistory(owner, repo, page, perPage, env) {
    const headers: Record<string, string> = {
      "User-Agent": "Tansu-Git-Proxy/1.0",
    };
    if (env.GITLAB_TOKEN) {
      headers["PRIVATE-TOKEN"] = env.GITLAB_TOKEN;
    }

    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${projectPath}/repository/commits?page=${page}&per_page=${perPage}`,
      { headers },
    );

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status}`);
    }

    const data = (await response.json()) as any[];
    return data.map((commit: any) => ({
      sha: commit.id,
      authorName: commit.author_name,
      authorDate: commit.authored_date,
      authorEmail: commit.author_email,
      committerName: commit.committer_name,
      committerDate: commit.committed_date,
      committerEmail: commit.committer_email,
      message: commit.message,
      commitUrl: commit.web_url,
    }));
  },

  async getCommitDetails(owner, repo, sha, env) {
    const headers: Record<string, string> = {
      "User-Agent": "Tansu-Git-Proxy/1.0",
    };
    if (env.GITLAB_TOKEN) {
      headers["PRIVATE-TOKEN"] = env.GITLAB_TOKEN;
    }

    const projectPath = encodeURIComponent(`${owner}/${repo}`);
    const response = await fetch(
      `https://gitlab.com/api/v4/projects/${projectPath}/repository/commits/${sha}`,
      { headers },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitLab API error: ${response.status}`);
    }

    const commit = (await response.json()) as any;
    return {
      sha: commit.id,
      authorName: commit.author_name,
      authorDate: commit.authored_date,
      authorEmail: commit.author_email,
      committerName: commit.committer_name,
      committerDate: commit.committed_date,
      committerEmail: commit.committer_email,
      message: commit.message,
      commitUrl: commit.web_url,
    };
  },

  async getLatestCommitHash(owner, repo, env) {
    const commits = await gitlabHandler.getCommitHistory(
      owner,
      repo,
      1,
      1,
      env,
    );
    if (commits.length === 0) {
      throw new Error("No commits found");
    }
    return commits[0].sha;
  },

  async getReadmeContent(owner, repo, env) {
    const headers: Record<string, string> = {
      "User-Agent": "Tansu-Git-Proxy/1.0",
    };
    if (env.GITLAB_TOKEN) {
      headers["PRIVATE-TOKEN"] = env.GITLAB_TOKEN;
    }

    const projectPath = encodeURIComponent(`${owner}/${repo}`);

    // Try common README filenames
    const candidates = ["README.md", "README", "readme.md"];
    for (const candidate of candidates) {
      const response = await fetch(
        `https://gitlab.com/api/v4/projects/${projectPath}/repository/files/${encodeURIComponent(candidate)}/raw?ref=HEAD`,
        { headers },
      );

      if (response.ok) {
        return response.text();
      }
    }

    return null;
  },
};

// Codeberg/Gitea API handler (Forgejo-compatible)
const codebergHandler: GitHostHandler = {
  async getCommitHistory(owner, repo, page, perPage, _env) {
    const response = await fetch(
      `https://codeberg.org/api/v1/repos/${owner}/${repo}/commits?page=${page}&limit=${perPage}`,
      {
        headers: { "User-Agent": "Tansu-Git-Proxy/1.0" },
      },
    );

    if (!response.ok) {
      throw new Error(`Codeberg API error: ${response.status}`);
    }

    const data = (await response.json()) as any[];
    return data.map((commit: any) => ({
      sha: commit.sha,
      authorName: commit.commit.author.name,
      authorDate: commit.commit.author.date,
      authorEmail: commit.commit.author.email,
      committerName: commit.commit.committer.name,
      committerDate: commit.commit.committer.date,
      committerEmail: commit.commit.committer.email,
      message: commit.commit.message,
      commitUrl: commit.html_url,
    }));
  },

  async getCommitDetails(owner, repo, sha, _env) {
    const response = await fetch(
      `https://codeberg.org/api/v1/repos/${owner}/${repo}/git/commits/${sha}`,
      {
        headers: { "User-Agent": "Tansu-Git-Proxy/1.0" },
      },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Codeberg API error: ${response.status}`);
    }

    const commit = (await response.json()) as any;
    return {
      sha: commit.sha,
      authorName: commit.author?.name || "",
      authorDate: commit.author?.date || "",
      authorEmail: commit.author?.email || "",
      committerName: commit.committer?.name || "",
      committerDate: commit.committer?.date || "",
      committerEmail: commit.committer?.email || "",
      message: commit.message,
      commitUrl: `https://codeberg.org/${owner}/${repo}/commit/${sha}`,
    };
  },

  async getLatestCommitHash(owner, repo, env) {
    const commits = await codebergHandler.getCommitHistory(
      owner,
      repo,
      1,
      1,
      env,
    );
    if (commits.length === 0) {
      throw new Error("No commits found");
    }
    return commits[0].sha;
  },

  async getReadmeContent(owner, repo, _env) {
    const response = await fetch(
      `https://codeberg.org/api/v1/repos/${owner}/${repo}/raw/README.md`,
      {
        headers: { "User-Agent": "Tansu-Git-Proxy/1.0" },
      },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Codeberg API error: ${response.status}`);
    }

    return response.text();
  },
};

// Bitbucket API handler
const bitbucketHandler: GitHostHandler = {
  async getCommitHistory(owner, repo, page, perPage, _env) {
    const response = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/commits?page=${page}&pagelen=${perPage}`,
      {
        headers: { "User-Agent": "Tansu-Git-Proxy/1.0" },
      },
    );

    if (!response.ok) {
      throw new Error(`Bitbucket API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    return (data.values || []).map((commit: any) => ({
      sha: commit.hash,
      authorName: commit.author?.user?.display_name || commit.author?.raw || "",
      authorDate: commit.date,
      authorEmail: "",
      committerName: commit.author?.user?.display_name || "",
      committerDate: commit.date,
      committerEmail: "",
      message: commit.message,
      commitUrl: commit.links?.html?.href || "",
    }));
  },

  async getCommitDetails(owner, repo, sha, _env) {
    const response = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/commit/${sha}`,
      {
        headers: { "User-Agent": "Tansu-Git-Proxy/1.0" },
      },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Bitbucket API error: ${response.status}`);
    }

    const commit = (await response.json()) as any;
    return {
      sha: commit.hash,
      authorName: commit.author?.user?.display_name || commit.author?.raw || "",
      authorDate: commit.date,
      authorEmail: "",
      committerName: commit.author?.user?.display_name || "",
      committerDate: commit.date,
      committerEmail: "",
      message: commit.message,
      commitUrl: commit.links?.html?.href || "",
    };
  },

  async getLatestCommitHash(owner, repo, env) {
    const commits = await bitbucketHandler.getCommitHistory(
      owner,
      repo,
      1,
      1,
      env,
    );
    if (commits.length === 0) {
      throw new Error("No commits found");
    }
    return commits[0].sha;
  },

  async getReadmeContent(owner, repo, _env) {
    const response = await fetch(
      `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/src/HEAD/README.md`,
      {
        headers: { "User-Agent": "Tansu-Git-Proxy/1.0" },
      },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Bitbucket API error: ${response.status}`);
    }

    return response.text();
  },
};

function getHandlerForHost(host: string): GitHostHandler {
  const normalizedHost = host.toLowerCase();

  if (normalizedHost.includes("github")) {
    return githubHandler;
  }
  if (normalizedHost.includes("gitlab")) {
    return gitlabHandler;
  }
  if (normalizedHost.includes("codeberg") || normalizedHost.includes("gitea")) {
    return codebergHandler;
  }
  if (normalizedHost.includes("bitbucket")) {
    return bitbucketHandler;
  }

  // Default to Gitea/Forgejo API for unknown hosts (common for self-hosted)
  return codebergHandler;
}

interface RequestBody {
  action: "history" | "commit" | "latest-hash" | "readme";
  repoUrl: string;
  page?: number;
  perPage?: number;
  sha?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const corsHeaders = getCorsHeaders(origin);

    // Handle OPTIONS preflight request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = (await request.json()) as RequestBody;
      const { action, repoUrl, page = 1, perPage = 30, sha } = body;

      if (!repoUrl || typeof repoUrl !== "string") {
        return new Response(
          JSON.stringify({ error: "Repository URL is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Validate and parse the repository URL
      const allowedHosts = getAllowedHosts(env);
      let url: URL;
      try {
        url = validateRepoUrl(repoUrl, allowedHosts);
      } catch (validationError: any) {
        return new Response(
          JSON.stringify({ error: validationError.message }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const { owner, repo } = parseRepoPath(url);
      const handler = getHandlerForHost(url.hostname);

      switch (action) {
        case "history": {
          const commits = await handler.getCommitHistory(
            owner,
            repo,
            page,
            perPage,
            env,
          );
          return new Response(JSON.stringify({ commits }), {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        }

        case "commit": {
          if (!sha || typeof sha !== "string") {
            return new Response(
              JSON.stringify({ error: "Commit SHA is required" }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
          const commit = await handler.getCommitDetails(owner, repo, sha, env);
          if (!commit) {
            return new Response(JSON.stringify({ error: "Commit not found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          return new Response(
            JSON.stringify({
              sha: commit.sha,
              html_url: commit.commitUrl,
              commit: {
                message: commit.message,
                author: {
                  name: commit.authorName,
                  email: commit.authorEmail,
                  date: commit.authorDate,
                },
                committer: {
                  name: commit.committerName,
                  email: commit.committerEmail,
                  date: commit.committerDate,
                },
              },
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600",
              },
            },
          );
        }

        case "latest-hash": {
          const latestSha = await handler.getLatestCommitHash(
            owner,
            repo,
            env,
          );
          return new Response(JSON.stringify({ sha: latestSha }), {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        }

        case "readme": {
          const content = await handler.getReadmeContent(owner, repo, env);
          return new Response(JSON.stringify({ content }), {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
            },
          });
        }

        default:
          return new Response(JSON.stringify({ error: "Unknown action" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      }
    } catch (error: any) {
      console.error("Git proxy error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process git request" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  },
};
