// @ts-nocheck

/** Common mocks for Playwright tests */
export async function stubRpc(page) {
  await page.route("**/rpc**", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });

  // Intercept dynamic imports to mock getMember function
  await page.route("**/service/ReadContractService*", async (route) => {
    const response = await route.fetch();
    let body = await response.text();

    // Replace the getMember function with our mock
    body = body.replace(
      /async function getMember\([^}]+\}/gs,
      `async function getMember(memberAddress) {
        if (!memberAddress) return null;
        return window.mockGetMemberResponse || {
          member_address: memberAddress,
          meta: "QmTestCID123mockipfs456789abcdef",
          projects: [
            {
              project: new Uint8Array([116, 101, 115, 116]),
              badges: ["contributor", "maintainer"]
            }
          ]
        };
      }`,
    );

    route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: body,
    });
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
  // Mock ReadContractService functions
  // ──────────────────────────────────────────────
  await page.addInitScript(() => {
    // Signal test mode to the app for deterministic flows
    (window as any).__TEST_MODE__ = true;
    // Force missing anonymous config path by default when requested in tests
    (window as any).__mockAnonymousConfigMissing = true;
    // Mock getProjectFromName globally
    (window as any).getProjectFromName = async (name) => {
      console.log("Mock getProjectFromName called with:", name);
      return {
        name: name || "demo",
        maintainers: ["G".padEnd(56, "A"), "G".padEnd(56, "C")],
        config: { url: "https://github.com/test/demo", hash: "abc123" },
      };
    };
  });

  // Route interception to inject our mock into imports
  await page.route("**/@service/ReadContractService*", async (route) => {
    const response = await route.fetch();
    let body = await response.text();

    // Append export that overrides the original
    body += `
      // Test mock override
      const originalGetProjectFromName = getProjectFromName;
      export function getProjectFromName(name) {
        if ((window as any).getProjectFromName) {
          return (window as any).getProjectFromName(name);
        }
        return originalGetProjectFromName(name);
      }
    `;

    route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: body,
    });
  });

  // Stub IPFS helper to make CID deterministic and match upload stub
  await page.route("**/src/utils/ipfsFunctions.ts", async (route) => {
    const body =
      'export const getIpfsBasicLink = (cid) => (cid ? "https://w3s.link/ipfs/" + cid : "");\n' +
      'export const getProposalLinkFromIpfs = (cid) => (cid ? getIpfsBasicLink(cid) + "/proposal.md" : "");\n' +
      'export const getOutcomeLinkFromIpfs = (cid) => (cid ? getIpfsBasicLink(cid) + "/outcomes.json" : "");\n' +
      'export const calculateDirectoryCid = async () => "bafytestcidmock";\n' +
      "export const fetchFromIPFS = async (...args) => fetch(...args);\n" +
      "export const fetchJSONFromIPFS = async () => null;\n" +
      "export const fetchTomlFromCid = async () => undefined;\n";
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // Wallet kit module stub at import level for both FlowService and ContractService
  await page.route("**/components/stellar-wallets-kit*", async (route) => {
    const js = `export const kit = { signTransaction: async (xdr) => ({ signedTxXdr: typeof xdr === 'string' ? xdr : String(xdr) }) };`;
    route.fulfill({
      status: 200,
      body: js,
      headers: { "content-type": "application/javascript" },
    });
  });

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

  // Soroban RPC base URL used by the app (@stellar/stellar-sdk rpc.Server)
  await page.route("https://soroban-testnet.stellar.org/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/sendTransaction")) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: "SUCCESS",
          hash: "mock",
          returnValue: "AAAAAA==",
        }),
      });
      return;
    }
    if (url.includes("getTransaction")) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ status: "SUCCESS", returnValue: "AAAAAA==" }),
      });
      return;
    }
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });

  // ──────────────────────────────────────────────
  // Soroban RPC (contract + tansu client)
  // ──────────────────────────────────────────────
  const sorobanPattern = "**/soroban/**";
  await page.route(sorobanPattern, (route) => {
    const url = route.request().url();
    // Short-circuit core contract calls with SUCCESS and, when appropriate, a returnValue
    if (url.includes("create_proposal")) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ status: "SUCCESS", returnValue: 1 }),
      });
      return;
    }
    if (
      url.includes("register") ||
      url.includes("update_config") ||
      url.includes("add_member") ||
      url.includes("vote") ||
      url.includes("execute") ||
      url.includes("commit") ||
      url.includes("set_badges")
    ) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ status: "SUCCESS" }),
      });
      return;
    }
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });

  // Mock delegation endpoint for uploads
  await page.route("**/api/w3up-delegation", (route) => {
    route.fulfill({ status: 200, body: new ArrayBuffer(0) });
  });

  // Stub w3up client so uploadDirectory returns the same CID as calculateDirectoryCid
  await page.route("**/@web3-storage/w3up-client*", async (route) => {
    const js = `export const create = async () => ({ agent: { did: () => 'did:test' }, addSpace: async () => ({ did: () => 'did:test' }), setCurrentSpace: async () => {}, uploadDirectory: async () => ({ toString: () => 'bafytestcidmock' }) });`;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body: js,
    });
  });

  // Stub delegation extract to always return ok
  await page.route(
    "**/@web3-storage/w3up-client/delegation*",
    async (route) => {
      const js = `export const extract = async () => ({ ok: {} });`;
      route.fulfill({
        status: 200,
        headers: { "content-type": "application/javascript" },
        body: js,
      });
    },
  );

  // Also stub generic send/getTransaction endpoints in case rpc.Server uses relative paths
  await stubTransactionSend(page);
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
