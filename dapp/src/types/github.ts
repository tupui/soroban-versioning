export interface FormattedCommit {
  message: string;
  author: { name: string; html_url: string };
  commit_date: string;
  html_url: string;
  sha: string;
}

export interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: Date;
  url: string;
}
