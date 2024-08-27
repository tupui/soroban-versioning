/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID: string;
  readonly PUBLIC_TANSU_CONTRACT_ID: string;
  readonly PUBLIC_SOROBAN_NETWORK_PASSPHRASE: string;
  readonly PUBLIC_SOROBAN_RPC_URL: string;
  readonly SOROBAN_SOURCE_ACCOUNT: string;
  readonly SOROBAN_NETWORK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
