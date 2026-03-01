import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";

StellarWalletsKit.init({
  modules: defaultModules(),
});

export { StellarWalletsKit as Kit };