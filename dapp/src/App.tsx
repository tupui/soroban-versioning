import { ChainMetadata, Connector } from "@soroban-react/types";
import { freighter } from "@soroban-react/freighter";
import { testnet } from "@soroban-react/chains";
import { SorobanReactProvider } from "@soroban-react/core";
import { APP_NAME, DEPLOYMENTS } from "./constants";
import { Layout } from "./components/layout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RegisterRepo } from "./pages/register-repo";
import { Menu } from "./pages/menu";
import { GetCommit } from "./pages/get-commit";

const chains: ChainMetadata[] = [testnet];
const connectors: Connector[] = [freighter()];

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Menu /> },
      { path: "/register", element: <RegisterRepo /> },
      { path: "/repos", element: <RegisterRepo /> },
      { path: "/get-commit", element: <GetCommit /> },
    ],
  },
]);

function App() {
  return (
    <SorobanReactProvider
      appName={APP_NAME}
      chains={chains}
      activeChain={testnet}
      connectors={connectors}
      deployments={DEPLOYMENTS}
    >
      <RouterProvider router={router} />
    </SorobanReactProvider>
  );
}

export default App;
