import * as SDK from "@stellar/stellar-sdk";
import { SorobanDomainsSDK } from "@creit.tech/sorobandomains-sdk";
import { getNetworkConfig } from "../utils/networks";

// Create domain SDK based on current network selection
function createDomainSDK() {
  const config = getNetworkConfig();
  const defaultFee = "100";
  const defaultTimeout = 30;
  const simulationAccount = "GCMFQP44AR32S7IRIUKNOEJW5PNWOCLRHLQWSHUCSV4QZOMUXZOVA7Q2"; // From tansu.toml
  
  return new SorobanDomainsSDK({
    stellarSDK: SDK,
    rpc: new SDK.rpc.Server(config.rpc),
    network: config.passphrase as SDK.Networks,
    vaultsContractId: config.domain_contract,
    defaultFee: defaultFee,
    defaultTimeout: defaultTimeout,
    simulationAccount: simulationAccount,
  });
}

export default createDomainSDK();
