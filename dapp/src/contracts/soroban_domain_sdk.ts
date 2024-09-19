import * as SDK from '@stellar/stellar-sdk';
import { SorobanDomainsSDK } from '@creit.tech/sorobandomains-sdk';

const rpcUrl = import.meta.env.PUBLIC_SOROBAN_RPC_URL;
const networkPassphrase = import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE;
const contractId = import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID;
const defaultFee = import.meta.env.PUBLIC_DEFAULT_FEE;
const defaultTimeout = import.meta.env.PUBLIC_DEFAULT_TIMEOUT;
const simulationAccount = import.meta.env.PUBLIC_TANSU_OWNER_ID;

console.log('RPC URL:', rpcUrl);
console.log('Network Passphrase:', networkPassphrase);
console.log('Contract ID:', contractId);
console.log('Default Fee:', defaultFee);
console.log('Default Timeout:', defaultTimeout);
console.log('Simulation Account:', simulationAccount);

const sdk: SorobanDomainsSDK = new SorobanDomainsSDK({
  stellarSDK: SDK,
  rpc: new SDK.SorobanRpc.Server(rpcUrl || 'https://soroban-testnet.stellar.org:443'),
  network: (networkPassphrase as SDK.Networks) || SDK.Networks.TESTNET,
  contractId: contractId || '',
  defaultFee: defaultFee || '100',
  defaultTimeout: parseInt(defaultTimeout || '30'),
  simulationAccount: simulationAccount || '',
});

export default sdk;