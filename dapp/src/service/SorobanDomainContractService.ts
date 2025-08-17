import sdk from "../contracts/soroban_domain_sdk";

/**
 * Resolve a domain name to its owner/address using Soroban Domains SDK and
 * normalize the response into a stable shape.
 */
async function getAddressFromDomain(domainName: string): Promise<{
  owner: string;
  address?: string;
} | null> {
  try {
    // Use the SDK as the single source of truth. The SDK decodes ScVal → JS.
    const res: any = await sdk.searchDomain({ domain: domainName });
    const v = (res && (res.value ?? res)) as any;
    if (v && typeof v.owner === "string") {
      return { owner: v.owner, address: v.address };
    }
    return null;
  } catch {
    return null;
  }
}

export { getAddressFromDomain };
