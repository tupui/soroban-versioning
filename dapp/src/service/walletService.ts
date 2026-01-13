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

export async function checkAndNotifyFunding(): Promise<void> {
  if (import.meta.env.MODE === "test") return;
  const publicKey = loadedPublicKey();
  if (!publicKey) return;

  console.log("🔍 Checking wallet funding for:", publicKey);

  try {
    const { exists, balance } = await getWalletHealth();
    console.log("🔍 Wallet health:", { exists, balance });

    const minRequired = 1;
    const networkPass = import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE || "";
    const network = /Test/i.test(networkPass) ? "testnet" : "mainnet";

    if (!exists || balance < minRequired) {
      console.log("🚨 Wallet needs funding! Opening modal");
      window.dispatchEvent(
        new CustomEvent("openFundingModal", {
          detail: { exists, balance, network },
        }),
      );
    } else {
      console.log("✅ Wallet is sufficiently funded");
    }
  } catch (error) {
    console.error("❌ Error checking wallet funding:", error);
  }
}

function initializeConnection(): void {
  const storedPublicKey = localStorage.getItem("publicKey");
  const storedProvider = localStorage.getItem("walletProvider");

  if (storedPublicKey && storedProvider) {
    connectionState.publicKey = storedPublicKey;
    connectionState.provider = storedProvider;
    connectedPublicKey.set(storedPublicKey);

    // ✅ Check funding for returning users
    setTimeout(() => {
      checkAndNotifyFunding();
    }, 500);
  }
}

/**
 * Check if the connected wallet exists and has funds.
 * Returns { exists: boolean, balance: number }.
 */
async function getWalletHealth(): Promise<{
  exists: boolean;
  balance: number;
}> {
  const publicKey = loadedPublicKey();
  const horizonUrl = import.meta.env.PUBLIC_HORIZON_URL;

  if (!publicKey) return { exists: false, balance: 0 };

  try {
    const resp = await fetch(`${horizonUrl}/accounts/${publicKey}`, {
      headers: { Accept: "application/json" },
    });

    if (resp.status === 404) {
      // Account not found on this network
      return { exists: false, balance: 0 };
    }

    if (!resp.ok) {
      console.warn(`Unexpected Horizon response: ${resp.status}`);
      return { exists: false, balance: 0 };
    }

    const json = await resp.json();
    const native = (json.balances || []).find(
      (b: any) => b.asset_type === "native",
    );
    const balance = native ? Number(native.balance) : 0;

    return { exists: true, balance };
  } catch (error) {
    console.error("Error checking wallet health:", error);
    return { exists: false, balance: 0 };
  }
}

export {
  loadedPublicKey,
  loadedProvider,
  setConnection,
  setConnection as setPublicKey,
  disconnect,
  initializeConnection,
  getWalletHealth,
};
