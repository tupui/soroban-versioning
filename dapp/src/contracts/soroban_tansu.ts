import * as Client from "tansu";

export default new Client.Client({
  networkPassphrase: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
  contractId: import.meta.env.PUBLIC_TANSU_CONTRACT_ID,
  rpcUrl: import.meta.env.PUBLIC_SOROBAN_RPC_URL,
  allowHttp: true,
});
