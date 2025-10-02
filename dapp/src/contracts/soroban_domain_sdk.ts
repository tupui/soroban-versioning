import * as SDK from "@stellar/stellar-sdk";
import { SorobanDomainsSDK } from "@creit.tech/sorobandomains-sdk";
import { getNetworkConfig } from "../utils/networks";

// Create domain SDK based on current network selection
function createDomainSDK() {
  const config = getNetworkConfig();
  const defaultFee = "100";
  const defaultTimeout = 30;
  const simulationAccount = import.meta.env.PUBLIC_TANSU_OWNER_ID;

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
