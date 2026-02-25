/**
 * Stellar Wallets Kit Initialization
 * 
 * Re-exports from the wrapper module which handles the dual implementation.
 * Uses feature flag (USE_NEW_WALLET_KIT env var) to switch between:
 * - Legacy: @creit.tech/stellar-wallets-kit@^1.9.5 (npm)
 * - New: @creit.tech/stellar-wallets-kit (JSR)
 */

export { getWalletKit as getKit} from "./stellar-wallets-kit-wrapper";
