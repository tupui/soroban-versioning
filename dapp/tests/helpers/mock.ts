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
