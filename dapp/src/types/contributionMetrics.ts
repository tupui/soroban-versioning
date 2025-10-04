export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  metadata: CommitMetadata;
}

export interface CommitMetadata {
  coAuthoredBy: Author[];
  reviewedBy: Author[];
  testedBy: Author[];
  approvedBy: Author[];
  [key: string]: Author[]; // Allow for custom metadata fields
}

export interface Author {
  name: string;
  email?: string;
}

export interface ContributorActivity {
  author: Author;
  commitCount: number;
  linesAdded: number;
  linesRemoved: number;
  firstCommit: string;
  lastCommit: string;
  monthlyActivity: MonthlyActivity[];
}

export interface MonthlyActivity {
  month: string; // YYYY-MM format
  commitCount: number;
  linesAdded: number;
  linesRemoved: number;
}

export interface PonyFactorResult {
  factor: number;
  topContributors: ContributorActivity[];
  totalContributors: number;
  explanation: string;
}

export interface ContributionMetrics {
  ponyFactor: PonyFactorResult;
  totalCommits: number;
  totalContributors: number;
  activeContributors: number; // Contributors with activity in last 3 months
  contributorActivity: ContributorActivity[];
  monthlyStats: {
    [month: string]: {
      commits: number;
      contributors: number;
      linesChanged: number;
    };
  };
  repositoryTimespan: {
    firstCommit: string;
    lastCommit: string;
    totalDays: number;
  };
}

export interface GitLogParseResult {
  commits: GitCommit[];
  metrics: ContributionMetrics;
}