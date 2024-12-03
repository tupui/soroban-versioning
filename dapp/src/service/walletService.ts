import { connectedPublicKey } from "utils/store";

const connectionState: { publicKey: string | undefined } = {
  publicKey: undefined,
};

function loadedPublicKey(): string | undefined {
  return connectionState.publicKey;
}

function setPublicKey(data: string): void {
  connectionState.publicKey = data;
  localStorage.setItem("publicKey", data);
  connectedPublicKey.set(data);
}

function initializeConnection(): void {
  const storedPublicKey = localStorage.getItem("publicKey");
  if (storedPublicKey) {
    setPublicKey(storedPublicKey);
  }
}

export { loadedPublicKey, setPublicKey, initializeConnection };
