import * as Client from "soroban_versioning";
import { rpcUrl } from "./util";

export default new Client.Client({
  ...Client.networks.testnet,
  rpcUrl,
  allowHttp: true,
});
