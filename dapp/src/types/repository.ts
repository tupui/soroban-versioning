export type RepositoryProvider =
  | "github"
  | "gitlab"
  | "forgejo"
  | "bitbucket"
  | "unknown";

export interface RepositoryDescriptor {
  /** Hostname where the repository is hosted (e.g. github.com) */
  host: string;
  /** Provider classification derived from the hostname */
  provider: RepositoryProvider;
  /** Repository owner/namespace */
  owner: string;
  /** Repository name */
  name: string;
  /** Optional ref (branch/tag) embedded in the original URL */
  ref?: string;
  /** Canonical HTTPS URL to the repository root */
  url: string;
}
