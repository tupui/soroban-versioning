import sdk from "../contracts/soroban_domain_sdk";

async function getAddressFromDomain(domainName: string) {
  return await sdk.searchDomain({ domain: domainName });
}

export { getAddressFromDomain };
