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
  readonly STORACHA_SING_PRIVATE_KEY: string;
  readonly STORACHA_PROOF: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
