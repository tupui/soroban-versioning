import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";

const kit: StellarWalletsKit = new StellarWalletsKit({
  modules: allowAllModules(),
  // @ts-ignore
  network: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
  selectedWalletId: FREIGHTER_ID,
});

export { kit };
