import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";
import { LedgerModule } from "@creit.tech/stellar-wallets-kit/modules/ledger.module";
import { getNetworkConfig } from "../utils/networks";

// Create wallet kit based on current network selection
function createWalletKit() {
  const config = getNetworkConfig();
  
  return new StellarWalletsKit({
    modules: [...allowAllModules(), new LedgerModule()],
    // @ts-ignore
    network: config.passphrase,
    selectedWalletId: FREIGHTER_ID,
  });
}

export const kit = createWalletKit();
