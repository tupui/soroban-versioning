/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SOROBAN_DOMAIN_CONTRACT_ID: string;
  readonly TANSU_CONTRACT_ID: string;
  readonly SOROBAN_NETWORK: string;
  readonly SOROBAN_NETWORK_PASSPHRASE: string;
  readonly SOROBAN_RPC_URL: string;
  readonly SOROBAN_SOURCE_ACCOUNT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
