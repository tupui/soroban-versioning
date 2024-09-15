export interface FormattedCommit {
  message: string;
  author: { name: string; html_url: string };
  commit_date: string;
  html_url: string;
  sha: string;
}
