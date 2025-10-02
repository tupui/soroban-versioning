export const networks = {
  testnet: {
    name: "Testnet",
    passphrase: "Test SDF Network ; September 2015",
    rpc: "https://soroban-testnet.stellar.org:443",
    horizon: "https://horizon-testnet.stellar.org",
    tansu_contract: import.meta.env.PUBLIC_TANSU_CONTRACT_ID,
    domain_contract: import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID,
  },
  mainnet: {
    name: "Mainnet",
    passphrase: "Public Global Stellar Network ; September 2015",
    rpc: "https://rpc.lightsail.network",
    horizon: "https://horizon.stellar.org",
    tansu_contract: import.meta.env.PUBLIC_TANSU_CONTRACT_ID,
    domain_contract: import.meta.env.PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID,
  },
};

export type NetworkName = keyof typeof networks;

export function getCurrentNetwork(): NetworkName {
  if (typeof window === "undefined") return "testnet";

  const saved = localStorage.getItem("network");
  if (saved === "testnet" || saved === "mainnet") {
    return saved;
  }
  return "testnet";
}

export function setCurrentNetwork(network: NetworkName) {
  if (typeof window !== "undefined") {
    localStorage.setItem("network", network);
  }
}

export function getNetworkConfig() {
  return networks[getCurrentNetwork()];
}

export function getNetwork(network: NetworkName) {
  return networks[network];
}
