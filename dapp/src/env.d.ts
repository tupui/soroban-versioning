/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SOROBAN_NETWORK_PASSPHRASE: string;
  readonly PUBLIC_SOROBAN_RPC_URL: string;
  readonly PUBLIC_HORIZON_URL: string;
  readonly PUBLIC_TANSU_CONTRACT_ID: string;
  readonly PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID: string;
  readonly PUBLIC_TANSU_OWNER_ID: string;
  readonly PUBLIC_DEFAULT_FEE: string;
  readonly PUBLIC_DEFAULT_TIMEOUT: number;
  readonly PUBLIC_DELEGATION_API_URL: string;
  /**
   * Optional URL for the Git proxy Cloudflare Worker.
   * When set, git operations will use this proxy instead of the local /api/git endpoint.
   * Examples:
   * - "https://git.tansu.dev" (production)
   * - "https://git-testnet.tansu.dev" (testnet)
   */
  readonly PUBLIC_GIT_PROXY_URL?: string;
  /**
   * Additional allowed Git hosts (comma-separated).
   * Used by the local /api/git endpoint to allow custom self-hosted Git servers.
   * Example: "gitlab.mycompany.com,git.example.org"
   */
  readonly GIT_ALLOWED_HOSTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
