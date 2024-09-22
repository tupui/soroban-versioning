import type { Record } from "@creit.tech/sorobandomains-sdk";
import { Domain404Error } from "@creit.tech/sorobandomains-sdk";
import sdk from "../contracts/soroban_domain_sdk";

async function getAddressFromDomain(domainName: string) {
  try {
    const domainRecord: Record = await sdk.searchDomain({ domain: domainName });
    return {
      error: false,
      message: domainRecord,
    };
  } catch (e) {
    if (e instanceof Error && e.name === Domain404Error.name) {
      return {
        error: true,
        message: "SDK error",
      };
    } else {
      return {
        error: true,
        message: "Simulation error",
      };
    }
  }
}

export { getAddressFromDomain };
