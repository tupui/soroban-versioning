/**
 * Environment Configuration Helper
 * Provides type-safe access to environment variables
 */

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: keyof ImportMetaEnv, fallback?: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback || '';
  }
  
  // Fallback for environments where import.meta is not available
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback || '';
  }
  
  return fallback || '';
}

/**
 * Check if environment variable is truthy
 */
function getEnvBool(key: keyof ImportMetaEnv, fallback = false): boolean {
  const value = getEnvVar(key);
  return value === 'true' || value === '1' || fallback;
}

/**
 * Launchtube configuration
 */
export const launchtubeConfig = {
  enabled: getEnvBool('PUBLIC_USE_LAUNCHTUBE'),
  token: getEnvVar('PUBLIC_LAUNCHTUBE_TOKEN'),
  baseUrl: 'https://testnet.launchtube.xyz'
};

/**
 * Stellar network configuration
 */
export const stellarConfig = {
  networkPassphrase: getEnvVar('PUBLIC_SOROBAN_NETWORK_PASSPHRASE', 'Test SDF Network ; September 2015'),
  rpcUrl: getEnvVar('PUBLIC_SOROBAN_RPC_URL', 'https://soroban-testnet.stellar.org:443'),
  horizonUrl: getEnvVar('PUBLIC_HORIZON_URL', 'https://horizon-testnet.stellar.org'),
  tansuContractId: getEnvVar('PUBLIC_TANSU_CONTRACT_ID'),
  sorobanDomainContractId: getEnvVar('PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID'),
  tansuOwnerId: getEnvVar('PUBLIC_TANSU_OWNER_ID'),
  defaultFee: getEnvVar('PUBLIC_DEFAULT_FEE', '100'),
  defaultTimeout: parseInt(getEnvVar('PUBLIC_DEFAULT_TIMEOUT', '30'), 10)
};

/**
 * Storage configuration
 */
export const storageConfig = {
  storachaPrivateKey: getEnvVar('STORACHA_SING_PRIVATE_KEY'),
  storachaProof: getEnvVar('STORACHA_PROOF')
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = getEnvVar('NODE_ENV') !== 'production';

/**
 * Check if we're in a browser environment
 */
export const isBrowser = typeof window !== 'undefined';