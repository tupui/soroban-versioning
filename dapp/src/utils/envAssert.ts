const requiredEnv = [
  "PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
  "PUBLIC_SOROBAN_RPC_URL",
  "PUBLIC_TANSU_CONTRACT_ID",
  "PUBLIC_TANSU_OWNER_ID",
  "PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID",
];

export function assertEnv(): void {
  const missing = requiredEnv.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
