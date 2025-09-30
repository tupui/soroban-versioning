import type { APIRoute } from 'astro';
import { GitLogService } from '../../service/GitLogService';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const prerender = false;

/**
 * POST /api/git-metrics
 * Platform-agnostic Git metrics endpoint
 * Fetches Git log data directly from any Git repository (GitHub, GitLab, Gitea, etc.)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Repository URL is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate repository URL format
    if (!isValidRepoUrl(repoUrl)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid repository URL format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get or clone the repository
    const repoPath = await cloneOrUpdateRepo(repoUrl);

    // Execute git log command
    const gitLogCommand = GitLogService.generateGitLogCommand({
      maxCount: 1000,
    });

    const gitLogOutput = await executeGitCommand(gitLogCommand, repoPath);

    // Parse and analyze the Git log
    const result = GitLogService.parseAndAnalyze(gitLogOutput);

    return new Response(JSON.stringify({
      success: true,
      data: result.metrics
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Git metrics API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Validate repository URL format
 * Supports HTTPS and SSH formats for any Git host
 */
function isValidRepoUrl(url: string): boolean {
  // HTTPS format: https://host.com/owner/repo.git or https://host.com/owner/repo
  const httpsPattern = /^https?:\/\/[\w\-.]+(:\d+)?\/([\w\-._]+\/)+([\w\-._]+)(\.git)?$/;

  // SSH format: git@host.com:owner/repo.git
  const sshPattern = /^git@[\w\-.]+(:\d+)?:([\w\-._]+\/)+[\w\-._]+(\.git)?$/;

  return httpsPattern.test(url) || sshPattern.test(url);
}

/**
 * Clone or update a Git repository
 * Uses a cache directory to avoid re-cloning
 */
async function cloneOrUpdateRepo(repoUrl: string): Promise<string> {
  const repoHash = Buffer.from(repoUrl).toString('base64').replace(/[/+=]/g, '_');
  const cacheDir = join(tmpdir(), 'tansu-git-cache');
  const repoPath = join(cacheDir, repoHash);

  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  if (existsSync(join(repoPath, '.git'))) {
    try {
      await executeGitCommand('git fetch origin', repoPath);
      await executeGitCommand('git reset --hard origin/HEAD', repoPath);
      return repoPath;
    } catch (error) {
    }
  }

  // Clone fresh copy with shallow clone for better performance (only last 1000 commits)
  try {
    await execAsync(`git clone --depth 1000 "${repoUrl}" "${repoPath}"`);
    return repoPath;
  } catch (error: any) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

/**
 * Execute a Git command in the specified directory
 */
async function executeGitCommand(command: string, cwd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command, { cwd });
    return stdout;
  } catch (error: any) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}