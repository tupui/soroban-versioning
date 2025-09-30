// Simple network configuration - just the basics
export const networks = {
  testnet: {
    name: "Testnet",
    passphrase: "Test SDF Network ; September 2015",
    rpc: "https://soroban-testnet.stellar.org:443",
    horizon: "https://horizon-testnet.stellar.org",
    tansu_contract: "CBCXMB3JKKDOYHMBIBH3IQDPVCLHV4LQPCYA2LPKLLQ6JNJHAYPCUFAN",
    domain_contract: "CAQWEZNN5X7LFD6PZBQXALVH4LSJW2KGNDMFJBQ3DWHXUVQ2JIZ6AQU6",
  },
  mainnet: {
    name: "Mainnet", 
    passphrase: "Public Global Stellar Network ; September 2015",
    rpc: typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? "http://localhost:4321/api/rpc" // Use proxy in development
      : "https://soroban-rpc.creit.tech", // Direct endpoint in production
    horizon: "https://horizon.stellar.org",
    tansu_contract: "CATRNPHYKNXAPNLHEYH55REB6YSAJLGCPA4YM6L3WUKSZOPI77M2UMKI", // From Makefile
    domain_contract: "CATRNPHYKNXAPNLHEYH55REB6YSAJLGCPA4YM6L3WUKSZOPI77M2UMKI", // From Makefile - same for now
  }
};

export type NetworkName = keyof typeof networks;

// Get the current network from localStorage or default to testnet
export function getCurrentNetwork(): NetworkName {
  if (typeof window === 'undefined') return 'testnet';
  
  const saved = localStorage.getItem('network');
  if (saved === 'testnet' || saved === 'mainnet') {
    return saved;
  }
  return 'testnet';
}

// Save network choice
export function setCurrentNetwork(network: NetworkName) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('network', network);
  }
}

// Get config for current network
export function getNetworkConfig() {
  return networks[getCurrentNetwork()];
}

// Get config for specific network
export function getNetwork(network: NetworkName) {
  return networks[network];
}