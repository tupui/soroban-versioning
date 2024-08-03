import { ChainMetadata, Connector } from "@soroban-react/types";
import { freighter } from "@soroban-react/freighter";
import { testnet } from "@soroban-react/chains";
import { SorobanReactProvider } from "@soroban-react/core";
import { APP_NAME, DEPLOYMENTS } from "./constants";
import { Layout } from "./components/layout";

const chains: ChainMetadata[] = [testnet];
const connectors: Connector[] = [freighter()];

function App() {
  return (
    <SorobanReactProvider
      appName={APP_NAME}
      chains={chains}
      activeChain={testnet}
      connectors={connectors}
      deployments={DEPLOYMENTS}
    >
      <Layout />
    </SorobanReactProvider>
  );
}

export default App;
