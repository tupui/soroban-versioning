import { connectedPublicKey } from "utils/store";

const connectionState: {
  publicKey: string | undefined;
  provider: string | undefined;
} = {
  publicKey: undefined,
  provider: undefined,
};

function loadedPublicKey(): string | undefined {
  return connectionState.publicKey;
}

function loadedProvider(): string | undefined {
  return connectionState.provider;
}

function setConnection(publicKey: string, provider: string): void {
  connectionState.publicKey = publicKey;
  connectionState.provider = provider;

  localStorage.setItem("publicKey", publicKey);
  localStorage.setItem("walletProvider", provider);

  connectedPublicKey.set(publicKey);
}

function disconnect(): void {
  connectionState.publicKey = undefined;
  connectionState.provider = undefined;

  localStorage.removeItem("publicKey");
  localStorage.removeItem("walletProvider");

  connectedPublicKey.set("");
}

function initializeConnection(): void {
  const storedPublicKey = localStorage.getItem("publicKey");
  const storedProvider = localStorage.getItem("walletProvider");

  if (storedPublicKey && storedProvider) {
    connectionState.publicKey = storedPublicKey;
    connectionState.provider = storedProvider;
    connectedPublicKey.set(storedPublicKey);
  }
}

export {
  loadedPublicKey,
  loadedProvider,
  setConnection,
  disconnect,
  initializeConnection,
};
