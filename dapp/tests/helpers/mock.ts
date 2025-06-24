// @ts-nocheck

/** Common mocks for Playwright tests */
export async function stubRpc(page) {
  await page.route("**/rpc**", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });
}

export async function stubDelegation(page) {
  await page.route("**/api/w3up-delegation", (route) => {
    // return empty delegation
    route.fulfill({ status: 200, body: new ArrayBuffer(0) });
  });
}

export async function stubTransactionSend(page) {
  await page.route("**/sendTransaction", (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        hash: "abc",
        returnValue: "AAAAAA==",
      }),
    });
  });
  await page.route("**/getTransaction**", (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ status: "SUCCESS", returnValue: "AAAAAA==" }),
    });
  });
}

export async function stubIpfs(page) {
  await page.route("**/ipfs/**", (route) => {
    route.fulfill({ status: 200, body: "OK" });
  });
}

// Stub GitHub raw file fetches for TOML configs
export async function stubGithub(page) {
  await page.route("https://raw.githubusercontent.com/**", (route) => {
    // minimal TOML with project details
    const toml = `name = "${MOCK_PROJECT.name}"
description = "${MOCK_PROJECT.description}"
`;
    route.fulfill({ status: 200, body: toml });
  });
  await page.route("https://github.com/**", (route) => {
    route.fulfill({ status: 200, body: "" });
  });
}

import { rpcMock } from "./rpcMock";
import { WALLET_PK, MOCK_PROJECT } from "./data";

export async function applyAllMocks(page) {
  // inject wallet and localStorage before any script executes
  await page.addInitScript(
    ({ pk }) => {
      // Pre-populate so most flows start in a connected state; tests that
      // want to exercise the connection UI can still click the button – the
      // ConnectWallet component will detect it's already connected and show
      // the "Profile" state.
      localStorage.setItem("publicKey", pk);

      // Helper flags consumed by rpcMock
      window.__lastRpcValidated = false;
      window.__nextFunc = "noop";

      // Generic stub implementation for the wallets-kit API used by the app
      const kitStub = {
        getAddress: async () => ({ address: pk }),
        // The UI passes a callback expecting wallet info – we synchronously invoke it
        openModal: async ({ onWalletSelected } = {}) => {
          if (onWalletSelected) await onWalletSelected({ id: "freighter" });
          return Promise.resolve();
        },
        setWallet: () => {},
        signTransaction: async () => ({
          signedTxXdr: JSON.stringify({ func: window.__nextFunc, args: {} }),
        }),
      };

      // Expose under window so legacy code can access it
      window.kit = kitStub;

      // Try to patch any instance created from the real library once it's evaluated
      // We can't guarantee load order, so use a micro-task + timeout
      const patchRealKit = () => {
        if (window.__kitPatched) return;
        if (window.StellarWalletsKit && window.StellarWalletsKit.prototype) {
          const proto = window.StellarWalletsKit.prototype;
          proto.getAddress = kitStub.getAddress;
          proto.openModal = kitStub.openModal;
          proto.setWallet = kitStub.setWallet;
          proto.signTransaction = kitStub.signTransaction;
          window.__kitPatched = true;
        }
      };

      // Retry a few times because load order is uncertain
      for (let i = 0; i < 5; i++) {
        setTimeout(patchRealKit, i * 50);
      }
    },
    { pk: WALLET_PK },
  );

  // RPC validation
  await page.route(/.*\/rpc$/, rpcMock);

  // stubRpc provides generic response but conflicts with rpcMock; omit to let rpcMock validate
  await stubDelegation(page);
  await stubTransactionSend(page);
  await stubIpfs(page);
  await stubGithub(page);

  // Horizon submission stub
  await page.route("https://horizon-testnet.stellar.org/**", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ result: "ok" }) });
  });
}
