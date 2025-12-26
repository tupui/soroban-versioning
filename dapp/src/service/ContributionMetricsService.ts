import { GitLogService } from "./GitLogService";
import { getCommitHistory } from "./RepositoryService";
import type { ContributionMetrics } from "../types/contributionMetrics";
import type { FormattedCommit } from "../types/github";
import type { RepositoryDescriptor } from "../types/repository";

/**
 * Service for calculating contribution metrics from repository commit data
 * Reuses the same data that CommitHistory component fetches (client-side only)
 */
export class ContributionMetricsService {
  /**
   * Fetch contribution metrics by analyzing repository commit history
   * Uses the same getCommitHistory() function as CommitHistory component
   */
  static async fetchMetrics(
    repository: RepositoryDescriptor | string,
    repoName?: string,
  ): Promise<ContributionMetrics> {
    try {
      const allCommits: FormattedCommit[] = [];
      const maxPages = 34;

      for (let page = 1; page <= maxPages; page++) {
        const history = await getCommitHistory(repository, repoName, page, 30);
        if (!history || history.length === 0) break;

        for (const dayGroup of history) {
          allCommits.push(...dayGroup.commits);
        }

        const totalInPage = history.reduce(
          (sum, day) => sum + day.commits.length,
          0,
        );
        if (totalInPage < 30) break;
      }

      const gitLog = this.convertToGitLogFormat(allCommits);

      const result = GitLogService.parseAndAnalyze(gitLog);

      return result.metrics;
    } catch (error) {
      console.error("Failed to fetch contribution metrics:", error);
      throw new Error("Failed to load contribution metrics");
    }
  }

  private static convertToGitLogFormat(commits: FormattedCommit[]): string {
    let gitLog = "";

    for (const commit of commits) {
      gitLog += `commit ${commit.sha}\n`;
      gitLog += `Author: ${commit.author.name} <unknown@email>\n`;
      gitLog += `AuthorDate: ${commit.commit_date}\n`;
      gitLog += `Commit: ${commit.author.name} <unknown@email>\n`;
      gitLog += `CommitDate: ${commit.commit_date}\n`;
      gitLog += `\n`;
      gitLog += `    ${commit.message}\n`;
      gitLog += `\n`;
    }

    return gitLog;
  }
}
