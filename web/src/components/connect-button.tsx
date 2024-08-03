import { useSorobanReact } from "@soroban-react/core";
export function ConnectButton() {
  const sorobanContext = useSorobanReact();

  const {
    activeChain,
    address,
    disconnect,
    setActiveConnectorAndConnect,
    setActiveChain,
  } = sorobanContext;
  const activeAccount = address;
  const browserWallets = sorobanContext.connectors;
  const supportedChains = sorobanContext.chains;

  const onClick = async () => {
    if (address) {
      await disconnect();
    } else {
      setActiveConnectorAndConnect &&
        setActiveConnectorAndConnect(browserWallets[0]);
    }
  };

  return (
    <button className="btn btn-neutral" onClick={onClick} type="button">
      {!address ? "Connect Wallet" : "Disconnect"}
    </button>
  );
}
