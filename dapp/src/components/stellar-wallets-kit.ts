import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";
import { LedgerModule } from "@creit.tech/stellar-wallets-kit/modules/ledger.module";
import { getNetworkConfig } from "../utils/networks";

function createWalletKit() {
  const config = getNetworkConfig();
  
  return new StellarWalletsKit({
    modules: [...allowAllModules(), new LedgerModule()],
    network: config.passphrase as any,
    selectedWalletId: FREIGHTER_ID,
  });
}

function getKit() {
  return createWalletKit();
}

export const kit = getKit();
