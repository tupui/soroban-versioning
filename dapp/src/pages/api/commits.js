import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

const executeCommand = (command) =>
  new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        reject(stderr || err.message);
      } else {
        resolve(stdout);
      }
    });
  });

const cloneRepository = async (username, repo) => {
  const tempDir = path.join(process.cwd(), `temp-${repo}-${Date.now()}`);
  const repoUrl = `https://github.com/${username}/${repo}.git`;
  await executeCommand(`git clone --bare --filter=tree:0 --single-branch ${repoUrl} ${tempDir}`);
  return tempDir;
};

const getCommitDetails = async (repoDir) => {
  const logCommand = `git --git-dir=${repoDir} log --pretty=format:'%H||%an||%ad||%s||%ae' --date=iso`;
  const stdout = await executeCommand(logCommand);

  const commits = stdout
    .trim()
    .split("\n")
    .map((line) => {
      const [sha, name, date, message, email] = line.split("||");
      return { sha, name, date, message, email };
    });

  const groupedCommits = commits.reduce((acc, commit) => {
    const date = new Date(commit.date).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      message: commit.message,
      author: {
        name: commit.name,
        html_url: `https://github.com/${commit.email.split('@')[0]}`, 
      },
      commit_date: commit.date,
      html_url: `https://github.com/${commit.sha}`, 
      sha: commit.sha,
    });
    return acc;
  }, {});

  return Object.entries(groupedCommits).map(([date, commits]) => ({
    date,
    commits,
  }));
};

export async function GET({ url }) {
  console.log("url", url);
  const username = "tupui"; 
  const repo = "soroban-versioning";
//   const params = new URLSearchParams(url.search)
//   const username = params.get("username")
//   const repo = params.get('repo')

  console.log("username", username);
  console.log("repo", repo);

  if (!username || !repo) {
    return new Response(
      JSON.stringify({ error: "Username and repository are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const repoDir = await cloneRepository(username, repo);
    const formattedCommits = await getCommitDetails(repoDir);
    await fs.rm(repoDir, { recursive: true, force: true });

    return new Response(JSON.stringify({ data: formattedCommits }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching commits:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
