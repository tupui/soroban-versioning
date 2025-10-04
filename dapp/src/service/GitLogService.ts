import type {
  GitCommit,
  GitLogParseResult,
  ContributionMetrics,
  ContributorActivity,
  PonyFactorResult,
  CommitMetadata,
  Author,
} from "../types/contributionMetrics";

export class GitLogService {
  private static readonly BOT_PATTERNS = [
    /dependabot/i,
    /renovate/i,
    /bot$/i,
    /\[bot\]/i,
    /greenkeeper/i,
    /snyk-bot/i,
    /github-actions/i,
    /codecov/i,
  ];


  private static isBot(name: string, email: string): boolean {
    const combined = `${name} ${email}`.toLowerCase();
    return this.BOT_PATTERNS.some(pattern => pattern.test(combined));
  }

  static parseGitLog(rawGitLog: string): GitCommit[] {
    const commits: GitCommit[] = [];
    const commitBlocks = rawGitLog.split(/(?=^commit [a-f0-9]{40}$)/m).filter(Boolean);

    for (const block of commitBlocks) {
      const commit = this.parseCommitBlock(block);
      if (commit) {
        commits.push(commit);
      }
    }

    return commits;
  }


  private static parseCommitBlock(block: string): GitCommit | null {
    const lines = block.split('\n');
    const commitMatch = lines[0]?.match(/^commit ([a-f0-9]{40})$/);

    if (!commitMatch || !commitMatch[1]) return null;

    const sha = commitMatch[1];
    let author = { name: '', email: '', date: '' };
    let committer = { name: '', email: '', date: '' };
    let message = '';
    let messageStarted = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.startsWith('Author: ')) {
        const authorMatch = line.match(/^Author: (.+) <(.+)>$/);
        if (authorMatch && authorMatch[1] && authorMatch[2]) {
          author.name = authorMatch[1];
          author.email = authorMatch[2];
        }
      } else if (line.startsWith('AuthorDate: ')) {
        author.date = line.substring('AuthorDate: '.length);
      } else if (line.startsWith('Commit: ')) {
        const committerMatch = line.match(/^Commit: (.+) <(.+)>$/);
        if (committerMatch && committerMatch[1] && committerMatch[2]) {
          committer.name = committerMatch[1];
          committer.email = committerMatch[2];
        }
      } else if (line.startsWith('CommitDate: ')) {
        committer.date = line.substring('CommitDate: '.length);
      } else if (line === '' && !messageStarted) {
        messageStarted = true;
      } else if (messageStarted && line.startsWith('    ')) {
        // Message lines are indented with 4 spaces
        message += line.substring(4) + '\n';
      }
    }

    message = message.trim();
    const metadata = this.parseCommitMetadata(message);

    return {
      sha,
      message,
      author,
      committer,
      metadata,
    };
  }

  private static parseCommitMetadata(message: string): CommitMetadata {
    const metadata: CommitMetadata = {
      coAuthoredBy: [],
      reviewedBy: [],
      testedBy: [],
      approvedBy: [],
    };

    // Pattern to match metadata: xxx-by: Name <email>
    const metadataPattern = /^[\s]*(.*?)-by:\s*(.+?)\s*<(.+?)>$/gim;
    let match;

    while ((match = metadataPattern.exec(message)) !== null) {
      const type = match[1];
      const name = match[2];
      const email = match[3];

      if (!type || !name || !email) continue;

      const normalizedType = type
        .toLowerCase()
        .replace(/[^a-z]+(.)/g, (_, char) => char.toUpperCase()) + 'By';

      const author: Author = { name: name.trim(), email: email.trim() };

      if (!metadata[normalizedType]) {
        (metadata as any)[normalizedType] = [];
      }

      (metadata[normalizedType] as Author[]).push(author);
    }

    return metadata;
  }

  static calculateMetrics(commits: GitCommit[]): ContributionMetrics {
    const contributorMap = new Map<string, ContributorActivity>();
    const monthlyStats: { [month: string]: { commits: number; contributors: number; linesChanged: number } } = {};

    for (const commit of commits) {
      // Skip bots
      if (this.isBot(commit.author.name, commit.author.email || '')) {
        continue;
      }

      const authorKey = `${commit.author.name}<${commit.author.email}>`;
      const commitDate = new Date(commit.author.date);
      const monthKey = `${commitDate.getFullYear()}-${String(commitDate.getMonth() + 1).padStart(2, '0')}`;

      if (!contributorMap.has(authorKey)) {
        contributorMap.set(authorKey, {
          author: { name: commit.author.name, email: commit.author.email },
          commitCount: 0,
          linesAdded: 0,
          linesRemoved: 0,
          firstCommit: commit.author.date,
          lastCommit: commit.author.date,
          monthlyActivity: [],
        });
      }

      const contributor = contributorMap.get(authorKey)!;
      contributor.commitCount++;

      if (new Date(commit.author.date) > new Date(contributor.lastCommit)) {
        contributor.lastCommit = commit.author.date;
      }

      if (new Date(commit.author.date) < new Date(contributor.firstCommit)) {
        contributor.firstCommit = commit.author.date;
      }

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { commits: 0, contributors: 0, linesChanged: 0 };
      }
      monthlyStats[monthKey].commits++;

      const existingMonth = contributor.monthlyActivity.find(m => m.month === monthKey);
      if (existingMonth) {
        existingMonth.commitCount++;
      } else {
        contributor.monthlyActivity.push({
          month: monthKey,
          commitCount: 1,
          linesAdded: 0,
          linesRemoved: 0,
        });
      }
    }

    for (const monthKey of Object.keys(monthlyStats)) {
      const monthData = monthlyStats[monthKey];
      if (monthData) {
        monthData.contributors = Array.from(contributorMap.values())
          .filter(c => c.monthlyActivity.some(m => m.month === monthKey)).length;
      }
    }

    const contributorActivity = Array.from(contributorMap.values())
      .sort((a, b) => b.commitCount - a.commitCount);

    const ponyFactor = this.calculatePonyFactor(contributorActivity);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const activeContributors = contributorActivity.filter(c =>
      new Date(c.lastCommit) >= threeMonthsAgo
    ).length;

    const commitDates = commits.map(c => new Date(c.author.date)).sort((a, b) => a.getTime() - b.getTime());
    const firstCommit = commitDates[0]?.toISOString() || '';
    const lastCommit = commitDates[commitDates.length - 1]?.toISOString() || '';
    const firstDate = commitDates[0];
    const lastDate = commitDates[commitDates.length - 1];
    const totalDays = firstDate && lastDate ?
      Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      ponyFactor,
      totalCommits: commits.length,
      totalContributors: contributorActivity.length,
      activeContributors,
      contributorActivity,
      monthlyStats,
      repositoryTimespan: {
        firstCommit,
        lastCommit,
        totalDays,
      },
    };
  }

  /**
   * Calculate Pony Factor - minimum number of contributors responsible for 50% of commits
   */
  private static calculatePonyFactor(contributors: ContributorActivity[]): PonyFactorResult {
    const totalCommits = contributors.reduce((sum, c) => sum + c.commitCount, 0);
    const targetCommits = totalCommits * 0.5;

    let cumulativeCommits = 0;
    let ponyFactor = 0;
    const topContributors: ContributorActivity[] = [];

    for (const contributor of contributors) {
      cumulativeCommits += contributor.commitCount;
      ponyFactor++;
      topContributors.push(contributor);

      if (cumulativeCommits >= targetCommits) {
        break;
      }
    }

    const percentage = totalCommits > 0 ? ((cumulativeCommits / totalCommits) * 100).toFixed(1) : '0';
    const explanation = `${ponyFactor} contributor${ponyFactor !== 1 ? 's' : ''} responsible for ${percentage}% of commits`;

    return {
      factor: ponyFactor,
      topContributors,
      totalContributors: contributors.length,
      explanation,
    };
  }

  /**
   * Parse raw Git log and return complete analysis
   */
  static parseAndAnalyze(rawGitLog: string): GitLogParseResult {
    const commits = this.parseGitLog(rawGitLog);
    const metrics = this.calculateMetrics(commits);

    return {
      commits,
      metrics,
    };
  }
}