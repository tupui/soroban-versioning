import {
  allowAllModules,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";
import { LedgerModule } from "@creit.tech/stellar-wallets-kit/modules/ledger.module";

const kit: StellarWalletsKit = new StellarWalletsKit({
  modules: [...allowAllModules(), new LedgerModule()],
  // @ts-ignore
  network: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
});

export { kit };
