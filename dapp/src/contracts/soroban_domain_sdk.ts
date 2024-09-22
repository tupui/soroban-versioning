import * as SDK from "@stellar/stellar-sdk";
import { SorobanDomainsSDK } from "@creit.tech/sorobandomains-sdk";

const contractId = import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID;
const defaultFee = import.meta.env.PUBLIC_DEFAULT_FEEL ?? "100";
const defaultTimeout = import.meta.env.PUBLIC_DEFAULT_TIMEOUT ?? 30;
const simulationAccount = import.meta.env.PUBLIC_TANSU_OWNER_ID;

const sdk: SorobanDomainsSDK = new SorobanDomainsSDK({
  stellarSDK: SDK,
  rpc: new SDK.SorobanRpc.Server(import.meta.env.PUBLIC_SOROBAN_RPC_URL),
  // @ts-ignore
  network: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
  contractId: contractId,
  defaultFee: defaultFee,
  defaultTimeout: defaultTimeout,
  simulationAccount: simulationAccount,
});

export default sdk;
