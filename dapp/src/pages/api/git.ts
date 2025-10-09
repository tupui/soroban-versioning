import type { APIRoute } from "astro";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface GitCloneOptions {
  depth?: number;
}

async function cloneRepository(
  repoUrl: string,
  options: GitCloneOptions = {},
): Promise<{ baseDir: string; repoDir: string }> {
  const baseDir = await mkdtemp(join(tmpdir(), "tansu-git-"));
  const repoDir = join(baseDir, "repo.git");

  const args = ["clone", "--bare", "--no-tags"];
  if (options.depth && options.depth > 0) {
    args.push("--depth", String(options.depth));
  }
  args.push(repoUrl, repoDir);

  try {
    await execFileAsync("git", args, {
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
  } catch (error) {
    await rm(baseDir, { recursive: true, force: true });
    throw error;
  }

  return { baseDir, repoDir };
}

async function runGitCommand(repoDir: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(
    "git",
    ["--git-dir", repoDir, ...args],
    {
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return stdout;
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

function buildCommitUrl(repoUrl: string, sha: string): string | undefined {
  const normalized = normalizeRepoUrl(repoUrl);

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("github.")) {
      return `${normalized}/commit/${sha}`;
    }
    if (host.includes("gitlab.")) {
      return `${normalized}/-/commit/${sha}`;
    }
    if (host.includes("bitbucket.")) {
      return `${normalized}/commits/${sha}`;
    }
  } catch {
    // Non-HTTP(S) URL (e.g., SSH) – we cannot build a web URL
    return undefined;
  }

  return undefined;
}

async function getCommitHistory(
  repoUrl: string,
  page: number,
  perPage: number,
) {
  const depth = Math.max(page * perPage, perPage);
  const { baseDir, repoDir } = await cloneRepository(repoUrl, { depth });

  try {
    const skip = Math.max(0, (page - 1) * perPage);
    const format = "%H%x1f%an%x1f%aI%x1f%ae%x1f%cn%x1f%cI%x1f%ce%x1f%B%x1e";
    const rawLog = await runGitCommand(repoDir, [
      "log",
      "--date=iso-strict",
      `--skip=${skip}`,
      "-n",
      String(perPage),
      `--pretty=format:${format}`,
    ]);

    const commits = rawLog
      .split("\x1e")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [
          sha,
          authorName,
          authorDate,
          authorEmail,
          committerName,
          committerDate,
          committerEmail,
          message,
        ] = entry.split("\x1f");

        return {
          sha,
          authorName,
          authorDate,
          authorEmail,
          committerName,
          committerDate,
          committerEmail,
          message: message?.trimEnd() ?? "",
          commitUrl: buildCommitUrl(repoUrl, sha || "") ?? "",
        };
      });

    return commits;
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
}

async function getCommitDetails(repoUrl: string, sha: string) {
  const { baseDir, repoDir } = await cloneRepository(repoUrl);

  try {
    const format = "%H%x1f%an%x1f%aI%x1f%ae%x1f%cn%x1f%cI%x1f%ce%x1f%B";
    const raw = await runGitCommand(repoDir, [
      "show",
      sha,
      "--quiet",
      "--date=iso-strict",
      `--pretty=format:${format}`,
    ]);

    const [
      commitSha,
      authorName,
      authorDate,
      authorEmail,
      committerName,
      committerDate,
      committerEmail,
      message,
    ] = raw.trim().split("\x1f");

    if (!commitSha) {
      return undefined;
    }

    return {
      sha: commitSha,
      html_url: buildCommitUrl(repoUrl, commitSha) ?? "",
      commit: {
        message: message?.trimEnd() ?? "",
        author: {
          name: authorName || "",
          email: authorEmail || "",
          date: authorDate || "",
        },
        committer: {
          name: committerName || "",
          email: committerEmail || "",
          date: committerDate || "",
        },
      },
    };
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
}

async function getLatestCommitHash(repoUrl: string) {
  const { baseDir, repoDir } = await cloneRepository(repoUrl, { depth: 1 });

  try {
    const sha = await runGitCommand(repoDir, ["rev-parse", "HEAD"]);
    return sha.trim();
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
}

async function getReadmeContent(repoUrl: string) {
  const { baseDir, repoDir } = await cloneRepository(repoUrl, { depth: 1 });
  const candidates = [
    "README.md",
    "README.MD",
    "README",
    "Readme.md",
    "readme.md",
  ];

  try {
    for (const candidate of candidates) {
      try {
        const content = await runGitCommand(repoDir, [
          "show",
          `HEAD:${candidate}`,
        ]);
        if (content) {
          return content;
        }
      } catch (_error) {
        // Try next candidate
        continue;
      }
    }
    return undefined;
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Safely parse JSON body; handle empty or invalid JSON without throwing
    let body: any = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { action, repoUrl, page = 1, perPage = 30, sha } = body ?? {};

    if (!repoUrl || typeof repoUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Repository URL is required" }),
        { status: 400 },
      );
    }

    switch (action) {
      case "history": {
        const commits = await getCommitHistory(repoUrl, page, perPage);
        return new Response(JSON.stringify({ commits }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      case "commit": {
        if (!sha || typeof sha !== "string") {
          return new Response(
            JSON.stringify({ error: "Commit SHA is required" }),
            { status: 400 },
          );
        }
        const commit = await getCommitDetails(repoUrl, sha);
        if (!commit) {
          return new Response(null, { status: 404 });
        }
        return new Response(JSON.stringify(commit), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      case "latest-hash": {
        const latestSha = await getLatestCommitHash(repoUrl);
        return new Response(JSON.stringify({ sha: latestSha }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      case "readme": {
        const content = await getReadmeContent(repoUrl);
        return new Response(JSON.stringify({ content }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Git API error", error);
    return new Response(
      JSON.stringify({ error: "Failed to process git request" }),
      { status: 500 },
    );
  }
};
