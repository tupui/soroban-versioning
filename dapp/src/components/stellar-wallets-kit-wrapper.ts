/**
 * Stellar Wallet Kit Loader (JSR only)
 */

import type { StellarWalletsKit as StellarWalletsKitType } from "@creit.tech/stellar-wallets-kit-jsr";

let cachedModule: typeof import("@creit.tech/stellar-wallets-kit-jsr") | null = null;
let kitInstance: StellarWalletsKitType | null = null;
let kitPromise: Promise<StellarWalletsKitType> | null = null;

/**
 * Load module (cached)
 */
export async function getWalletKit() {
  if (cachedModule) return cachedModule;

  console.log("[WalletKit] Loading JSR module...");
  cachedModule = await import("@creit.tech/stellar-wallets-kit-jsr");

  console.log("[WalletKit] ✅ Module loaded");

  return cachedModule;
}

/**
 * Get singleton kit instance
 */
export async function getKit(): Promise<StellarWalletsKitType> {
  if (kitInstance) return kitInstance;
  if (kitPromise) return kitPromise;

  kitPromise = (async () => {
    const { StellarWalletsKit } = await getWalletKit();

    const kit = new StellarWalletsKit() as StellarWalletsKitType;

    kitInstance = kit;

    console.log("[WalletKit] ✅ Kit initialized");

    return kit;
  })();

  return kitPromise;
}