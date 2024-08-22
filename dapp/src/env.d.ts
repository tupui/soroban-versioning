/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly TANSU_CONTRACT_ID: string
  readonly SOROBAN_NETWORK: string
  readonly SOROBAN_NETWORK_PASSPHRASE: string;
  readonly SOROBAN_RPC_URL: string;
  readonly SOROBAN_SOURCE_ACCOUNT: string;
}
