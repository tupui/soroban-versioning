const requiredEnv = [
  "PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
  "PUBLIC_SOROBAN_RPC_URL",
  "PUBLIC_HORIZON_URL",
  "PUBLIC_TANSU_CONTRACT_ID",
  "PUBLIC_TANSU_OWNER_ID",
  "PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID",
  "PUBLIC_DELEGATION_API_URL",
];

export function assertEnv(): void {
  const missing = requiredEnv.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

/**
 * Validate environment configuration for Freighter and Soroban connectivity
 * This helps debug the "Cannot destructure property 'simulation'" error
 */
export function validateFreighterEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const requiredEnvVars = [
    "PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
    "PUBLIC_SOROBAN_RPC_URL",
    "PUBLIC_HORIZON_URL",
    "PUBLIC_TANSU_CONTRACT_ID",
    "PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID",
  ];

  for (const envVar of requiredEnvVars) {
    const value = import.meta.env[envVar];
    if (!value) {
      errors.push(`Missing required environment variable: ${envVar}`);
    } else if (value.trim() === "") {
      errors.push(`Environment variable ${envVar} is empty`);
    }
  }

  // Validate RPC URL format
  const rpcUrl = import.meta.env.PUBLIC_SOROBAN_RPC_URL;
  if (rpcUrl && !rpcUrl.startsWith("http")) {
    errors.push("PUBLIC_SOROBAN_RPC_URL must be a valid HTTP/HTTPS URL");
  }

  // Validate Horizon URL format
  const horizonUrl = import.meta.env.PUBLIC_HORIZON_URL;
  if (horizonUrl && !horizonUrl.startsWith("http")) {
    errors.push("PUBLIC_HORIZON_URL must be a valid HTTP/HTTPS URL");
  }

  // Check for common configuration issues
  const networkPassphrase = import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE;
  if (networkPassphrase) {
    if (
      !networkPassphrase.includes("Test") &&
      !networkPassphrase.includes("Public")
    ) {
      warnings.push(
        'Network passphrase should contain "Test" or "Public" to indicate the correct network',
      );
    }
  }

  // Validate contract IDs (should be valid Stellar addresses)
  const contractId = import.meta.env.PUBLIC_TANSU_CONTRACT_ID;
  if (contractId && !/^[A-Z0-9]{56}$/.test(contractId)) {
    warnings.push(
      "PUBLIC_TANSU_CONTRACT_ID should be a valid 56-character Stellar address",
    );
  }

  const domainContractId = import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID;
  if (domainContractId && !/^[A-Z0-9]{56}$/.test(domainContractId)) {
    warnings.push(
      "PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID should be a valid 56-character Stellar address",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test network connectivity to help debug Freighter issues
 */
export async function testNetworkConnectivity(): Promise<{
  rpcConnected: boolean;
  horizonConnected: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let rpcConnected = false;
  let horizonConnected = false;

  // Test RPC connectivity
  try {
    const rpcUrl = import.meta.env.PUBLIC_SOROBAN_RPC_URL;
    if (!rpcUrl) {
      errors.push("PUBLIC_SOROBAN_RPC_URL not configured");
    } else {
      const response = await fetch(`${rpcUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      rpcConnected = response.ok;
      if (!response.ok) {
        errors.push(
          `RPC health check failed: ${response.status} ${response.statusText}`,
        );
      }
    }
  } catch (error: any) {
    errors.push(`RPC connectivity error: ${error.message}`);
  }

  // Test Horizon connectivity
  try {
    const horizonUrl = import.meta.env.PUBLIC_HORIZON_URL;
    if (!horizonUrl) {
      errors.push("PUBLIC_HORIZON_URL not configured");
    } else {
      const response = await fetch(`${horizonUrl}/`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      horizonConnected = response.ok;
      if (!response.ok) {
        errors.push(
          `Horizon connectivity failed: ${response.status} ${response.statusText}`,
        );
      }
    }
  } catch (error: any) {
    errors.push(`Horizon connectivity error: ${error.message}`);
  }

  return { rpcConnected, horizonConnected, errors };
}
