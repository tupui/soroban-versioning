import * as SDK from "@stellar/stellar-sdk";
import { SorobanDomainsSDK } from "@creit.tech/sorobandomains-sdk";

const vaultsContractId = import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID;
const defaultFee = import.meta.env.PUBLIC_DEFAULT_FEE ?? "100";
const defaultTimeout = import.meta.env.PUBLIC_DEFAULT_TIMEOUT ?? 30;
const simulationAccount = import.meta.env.PUBLIC_TANSU_OWNER_ID;
const networkPassphrase = import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE;

const sdk = new SorobanDomainsSDK({
  stellarSDK: SDK,
  rpc: new SDK.rpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL),
  network: networkPassphrase as SDK.Networks,
  vaultsContractId: vaultsContractId,
  defaultFee: defaultFee,
  defaultTimeout: defaultTimeout,
  simulationAccount: simulationAccount,
});

export default sdk;
