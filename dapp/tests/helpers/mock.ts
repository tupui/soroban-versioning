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
  // Allow everything by default, we only override selected external calls
  await page.route("**", (route) => route.continue());

  // ──────────────────────────────────────────────
  // Wallet signing
  // ──────────────────────────────────────────────
  await page.addInitScript(() => {
    // Provide a minimal stub for kit used in dapp
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.kit = {
      signTransaction: async (xdr) => ({ signedTxXdr: xdr }),
    };
  });

  // ──────────────────────────────────────────────
  // GitHub raw content (README / TOML)
  // ──────────────────────────────────────────────
  await page.route("https://raw.githubusercontent.com/**", (route) => {
    route.fulfill({ status: 200, body: "# Mock README\nTest" });
  });

  // ──────────────────────────────────────────────
  // Stellar Horizon API
  // ──────────────────────────────────────────────
  await page.route("https://horizon-testnet.stellar.org/**", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });

  // ──────────────────────────────────────────────
  // Soroban RPC (contract + tansu client)
  // ──────────────────────────────────────────────
  const sorobanPattern = "**/soroban/**";
  await page.route(sorobanPattern, (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });
}

export async function mockCreateProposalFlow(page) {
  await page.route("**/tansu/create_proposal", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ result: "ok" }) });
  });
}

export async function mockVoteToProposal(page) {
  await page.route("**/tansu/vote", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ result: "ok" }) });
  });
}

export async function mockExecuteProposal(page) {
  await page.route("**/tansu/execute", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ result: "ok" }) });
  });
}

export async function mockDonation(page) {
  await page.route("**/operations/payment", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ result: "ok" }) });
  });
}

/**
 * Apply minimal mocks that still allow real contract service testing
 * This catches method signature issues that aggressive mocking would hide
 */
export async function applyMinimalMocks(page) {
  // Allow everything by default
  await page.route("**", (route) => route.continue());

  // Only mock external services, not internal contract logic
  await page.route("https://raw.githubusercontent.com/**", (route) => {
    route.fulfill({ status: 200, body: "# Mock README\nTest" });
  });

  await page.route("https://horizon-testnet.stellar.org/**", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });

  // Mock only the final RPC transaction submission, not the contract client
  await page.route("**/soroban-testnet.stellar.org/**", (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        hash: "mock_tx_hash",
        result: "AAAAAA==",
      }),
    });
  });

  // Provide realistic wallet kit that would catch signAndSend vs signedXDRToResult issues
  await page.addInitScript(() => {
    // Mock a wallet kit that behaves like the real one
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.kit = {
      signTransaction: async (xdr) => {
        // Simulate real wallet behavior - return signed XDR
        if (!xdr || typeof xdr !== "string") {
          throw new Error("Invalid XDR provided to wallet");
        }
        return { signedTxXdr: `signed_${xdr}` };
      },
    };
  });
}

/**
 * Apply diagnostic mocks that log what they're intercepting for debugging
 */
export async function applyDiagnosticMocks(page) {
  // Log all external requests being made
  await page.route("**", (route) => {
    const url = route.request().url();
    if (
      url.includes("github") ||
      url.includes("soroban") ||
      url.includes("horizon")
    ) {
      console.log(`[MOCK] Intercepting: ${url}`);
    }
    route.continue();
  });

  // Mock with logging
  await page.route("https://raw.githubusercontent.com/**", (route) => {
    console.log(`[MOCK] GitHub raw content: ${route.request().url()}`);
    route.fulfill({ status: 200, body: "# Mock README\nTest" });
  });

  await page.route("**/soroban/**", (route) => {
    console.log(`[MOCK] Soroban RPC: ${route.request().url()}`);
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });

  // Enhanced wallet kit for debugging
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.kit = {
      signTransaction: async (xdr) => {
        console.log(
          "[MOCK] Wallet signTransaction called with XDR length:",
          xdr?.length,
        );
        if (!xdr || typeof xdr !== "string") {
          console.error("[MOCK] Invalid XDR provided to wallet:", xdr);
          throw new Error("Invalid XDR provided to wallet");
        }
        return { signedTxXdr: `signed_${xdr}` };
      },
    };
  });
}
