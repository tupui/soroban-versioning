import type { ContributionMetrics } from "../types/contributionMetrics";

export class ContributionMetricsService {
  /**
   * Fetch contribution metrics for a project by analyzing Git log
   * This calls the backend API which executes Git commands on the repository
   */
  static async fetchMetrics(repoUrl: string): Promise<ContributionMetrics> {
    try {
      const repoInfo = this.parseRepoInfo(repoUrl);
      if (!repoInfo) {
        throw new Error('Invalid repository URL');
      }

      // Call the backend API to fetch real Git log data
      const response = await fetch('/api/git-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch Git metrics');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch Git metrics');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to fetch contribution metrics:', error);
      throw new Error('Failed to load contribution metrics');
    }
  }

  /**
   * Parse repository URL to extract owner and repo name
   * Supports both HTTPS and SSH URL formats from any Git hosting platform
   */
  static parseRepoInfo(repoUrl: string): { owner: string; repo: string } | null {
    try {
      // Handle SSH URLs like git@github.com:owner/repo.git
      if (repoUrl.startsWith('git@')) {
        const sshMatch = repoUrl.match(/git@[^:]+:([^\/]+)\/(.+?)(?:\.git)?$/);
        if (sshMatch && sshMatch[1] && sshMatch[2]) {
          return {
            owner: sshMatch[1],
            repo: sshMatch[2],
          };
        }
      }

      // Handle HTTPS URLs like https://github.com/owner/repo.git
      const url = new URL(repoUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);

      if (pathParts.length >= 2 && pathParts[0] && pathParts[1]) {
        return {
          owner: pathParts[0],
          repo: pathParts[1].replace('.git', ''),
        };
      }
    } catch {
      // Invalid URL format
    }

    return null;
  }
}