import { useSorobanReact } from "@soroban-react/core";

export function ConnectButton() {
  const sorobanContext = useSorobanReact();

  const { address, disconnect, setActiveConnectorAndConnect } = sorobanContext;
  const browserWallets = sorobanContext.connectors;

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
