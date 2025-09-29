/**
 * Launchtube Configuration Utilities
 * Helper functions for managing Launchtube setup and configuration
 */

import { isLaunchtubeEnabled, checkLaunchtubeHealth } from '../service/LaunchtubeService';
import { launchtubeConfig, stellarConfig } from './env';

export interface LaunchtubeConfig {
  enabled: boolean;
  token?: string;
  baseUrl: string;
  isHealthy?: boolean;
  credits?: number;
  error?: string;
}

/**
 * Get current Launchtube configuration
 */
export function getLaunchtubeConfig(): LaunchtubeConfig {
  return {
    enabled: isLaunchtubeEnabled(),
    token: launchtubeConfig.token,
    baseUrl: launchtubeConfig.baseUrl,
  };
}

/**
 * Validate Launchtube token format
 */
export function isValidLaunchtubeToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Each part should be base64url encoded
  try {
    parts.forEach(part => {
      if (!part) throw new Error('Empty part');
      // Basic base64url validation
      if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error('Invalid characters');
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Launchtube setup instructions
 */
export function getLaunchtubeInstructions(): {
  steps: string[];
  claimUrl: string;
  activateUrl: string;
} {
  return {
    steps: [
      "Visit the Launchtube claim page to get a new token",
      "Copy the JWT token provided",
      "Add the token to your .env file as PUBLIC_LAUNCHTUBE_TOKEN",
      "Set PUBLIC_USE_LAUNCHTUBE=true in your .env file",
      "Restart your development server",
    ],
    claimUrl: "https://testnet.launchtube.xyz/gen",
    activateUrl: "https://testnet.launchtube.xyz/activate",
  };
}

/**
 * Check if Launchtube should be recommended based on network conditions
 */
export async function shouldRecommendLaunchtube(): Promise<{
  recommend: boolean;
  reason: string;
}> {
  // Always recommend for testnet to reduce friction
  const networkPassphrase = stellarConfig.networkPassphrase;
  if (networkPassphrase?.includes("Test")) {
    return {
      recommend: true,
      reason: "Launchtube eliminates the need for testnet XLM and simplifies transaction submission"
    };
  }

  // For mainnet, recommend based on user experience factors
  return {
    recommend: true,
    reason: "Launchtube handles transaction fees, retries, and network complexity automatically"
  };
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toLocaleString();
}

/**
 * Get credit level status
 */
export function getCreditStatus(credits: number): {
  level: 'high' | 'medium' | 'low' | 'critical';
  message: string;
  color: string;
} {
  if (credits >= 100000) {
    return {
      level: 'high',
      message: 'Plenty of credits available',
      color: '#10b981'
    };
  } else if (credits >= 10000) {
    return {
      level: 'medium',
      message: 'Good credit balance',
      color: '#10b981'
    };
  } else if (credits >= 1000) {
    return {
      level: 'low',
      message: 'Credits running low',
      color: '#f59e0b'
    };
  } else {
    return {
      level: 'critical',
      message: 'Very low credits - consider topping up',
      color: '#ef4444'
    };
  }
}

/**
 * Estimate transaction cost in stroops
 * This is a rough estimate - actual costs may vary
 */
export function estimateTransactionCost(operationType: string): number {
  const baseCost = 100; // Base Stellar transaction fee in stroops
  
  // Soroban operations typically cost more due to resource usage
  const sorobanMultiplier = {
    'contract_invoke': 10,
    'contract_deploy': 50,
    'vote': 15,
    'commit': 5,
    'execute': 20,
    'setup': 25,
  };
  
  const multiplier = sorobanMultiplier[operationType as keyof typeof sorobanMultiplier] || 10;
  return baseCost * multiplier;
}

/**
 * Check if user has enough credits for estimated operations
 */
export function hasEnoughCredits(
  currentCredits: number, 
  estimatedOperations: number, 
  operationType: string = 'contract_invoke'
): {
  sufficient: boolean;
  estimatedCost: number;
  remaining: number;
} {
  const estimatedCost = estimateTransactionCost(operationType) * estimatedOperations;
  const remaining = currentCredits - estimatedCost;
  
  return {
    sufficient: remaining >= 0,
    estimatedCost,
    remaining: Math.max(0, remaining)
  };
}