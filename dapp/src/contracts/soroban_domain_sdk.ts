import * as SDK from '@stellar/stellar-sdk';
import { SorobanDomainsSDK } from '@creit.tech/sorobandomains-sdk';
import { Networks } from 'soroban_versioning';

const sdk: SorobanDomainsSDK = new SorobanDomainsSDK({
  stellarSDK: SDK,
  rpc: new SDK.SorobanRpc.Server(process.env.PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org:443'),
  network: (process.env.SOROBAN_NETWORK as Networks) || Networks.TESTNET,
  contractId: process.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID || '',
  defaultFee: process.env.DEFAULT_FEE || '100',
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30'),
  simulationAccount: process.env.SIMULATION_ACCOUNT || '',
});

export default sdk;