import { ChainSelect } from "./chain-select";
import { ConnectButton } from "./connect-button";
import { WalletInfo } from "./wallet-info";

export function Navbar() {
  return (
    <div className="navbar bg-base-100">
      <ConnectButton />
      <ChainSelect />
      <WalletInfo />
    </div>
  );
}
