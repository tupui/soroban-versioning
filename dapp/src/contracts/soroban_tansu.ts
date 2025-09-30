import * as Client from "../../packages/tansu";
import { getNetworkConfig } from "../utils/networks";

// Create client based on current network selection
function createTansuClient() {
  const config = getNetworkConfig();
  
  return new Client.Client({
    networkPassphrase: config.passphrase,
    contractId: config.tansu_contract,
    rpcUrl: config.rpc,
    // Allow insecure HTTP connections only in development to prevent MITM attacks in production
    allowHttp: import.meta.env.DEV,
  });
}

export default createTansuClient();
