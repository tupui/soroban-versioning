import {
  allowAllModules,
  FREIGHTER_ID,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";

const kit: StellarWalletsKit = new StellarWalletsKit({
  modules: allowAllModules(),
  // @ts-ignore
  network: import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
  selectedWalletId: FREIGHTER_ID,
});

const connectionState: { publicKey: string | undefined } = {
  publicKey: undefined,
};

function loadedPublicKey(): string | undefined {
  return connectionState.publicKey;
}

function setPublicKey(data: string): void {
  connectionState.publicKey = data;
  localStorage.setItem("publicKey", data);
}

function initializeConnection(): void {
  const storedPublicKey = localStorage.getItem("publicKey");
  if (storedPublicKey) {
    setPublicKey(storedPublicKey);
  }
}

export { kit, loadedPublicKey, setPublicKey, initializeConnection };
