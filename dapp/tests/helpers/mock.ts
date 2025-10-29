// @ts-nocheck

import { rpcMock } from "./rpcMock";
import { WALLET_PK, MOCK_PROJECT, MOCK_PROPOSAL, MOCK_MEMBER } from "./data";

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
        return window.mockGetMemberResponse || ${JSON.stringify(MOCK_MEMBER)};
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
  // Mock delegation endpoint (Cloudflare Worker)
  await page.route(/(ipfs.*\.tansu\.dev|ipfs-delegation.*\.workers\.dev)/, (route) => {
    // Create a minimal mock CAR archive that simulates a delegation
    // This is a simplified structure that should allow tests to pass
    const mockCarBytes = new Uint8Array([
      // CAR v1 header
      0x0a,
      0xa1,
      0x67,
      0x76,
      0x65,
      0x72,
      0x73,
      0x69,
      0x6f,
      0x6e,
      0x01,
      // Root CID (simplified)
      0x12,
      0x20,
      // Add 32 bytes for the CID hash
      ...Array(32).fill(0x01),
      // Add minimal block data
      0x24, // varint for block size
      0x12,
      0x20, // CID prefix
      ...Array(32).fill(0x02), // block CID
      0x08, // block data size
      ...Array(8).fill(0x03), // block data
    ]);

    route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: mockCarBytes,
    });
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
url = "${MOCK_PROJECT.config_url}"
`;
    route.fulfill({ status: 200, body: toml });
  });
  await page.route("https://github.com/**", (route) => {
    route.fulfill({ status: 200, body: "" });
  });
}

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
    // Define WALLET_PK in window context for mocks to use
    (window as any).WALLET_PK = "${WALLET_PK}";
    // Mock getProjectFromName globally
    (window as any).getProjectFromName = async (name) => {
      const result = {
        name: name || "demo",
        maintainers: ["G".padEnd(56, "A"), "G".padEnd(56, "C"), "${WALLET_PK}"],
        config: { url: "https://github.com/test/demo", ipfs: "abc123" },
      };
      console.log(
        "Mock getProjectFromName called with:",
        name,
        "returning:",
        result,
      );
      return result;
    };

    // Mock other ReadContractService functions needed by governance components
    (window as any).getProposalPages = async (projectName: string) => {
      return 1; // Return 1 page
    };

    (window as any).getProposals = async (
      projectName: string,
      page: number,
    ) => {
      return [MOCK_PROPOSAL]; // Return mock proposal
    };

    // Mock getMember function
    (window as any).getMember = async (memberAddress: string) => {
      if (!memberAddress) return null;
      return MOCK_MEMBER;
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

      // Mock proposal functions
      export async function getProposalPages(projectName) {
        if ((window as any).getProposalPages) {
          return (window as any).getProposalPages(projectName);
        }
        return 1;
      }

      export async function getProposals(projectName, page) {
        if ((window as any).getProposals) {
          return (window as any).getProposals(projectName, page);
        }
        return [${JSON.stringify(MOCK_PROPOSAL)}];
      }

      // Mock getMember function
      export async function getMember(memberAddress) {
        if ((window as any).getMember) {
          return (window as any).getMember(memberAddress);
        }
        return ${JSON.stringify(MOCK_MEMBER)};
      }
    `;

    route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: body,
    });
  });

  // Mock ReadContractService at multiple import paths to ensure it works
  await page.route("**/service/ReadContractService*", async (route) => {
    const body = `
      // Mock ReadContractService functions
      export async function getProjectFromName(name) {
        if (window.getProjectFromName) {
          return window.getProjectFromName(name);
        }
        // For new project names, return null to indicate they don't exist
        if (name === "testproject123" || name === "newproject" || name === "flowtest") {
          return null;
        }
        // Return mock project for existing names
        return ${JSON.stringify(MOCK_PROJECT)};
      }

      export async function getProposalPages(projectName) {
        if (window.getProposalPages) {
          return window.getProposalPages(projectName);
        }
        return 1;
      }

      export async function getProposals(projectName, page) {
        if (window.getProposals) {
          return window.getProposals(projectName, page);
        }
        return [${JSON.stringify(MOCK_PROPOSAL)}];
      }

      export async function getMember(memberAddress) {
        if (window.mockGetMemberResponse) {
          return window.mockGetMemberResponse;
        }
        if (window.getMember) {
          return window.getMember(memberAddress);
        }
        return ${JSON.stringify(MOCK_MEMBER)};
      }

      export async function getProject(projectKey) {
        return ${JSON.stringify(MOCK_PROJECT)};
      }

      export async function getProjectFromId(projectId) {
        return ${JSON.stringify(MOCK_PROJECT)};
      }

      export async function getProjectHash(projectKey) {
        return "abc123";
      }

      export async function getBadges(projectKey) {
        return {
          developer: [window.WALLET_PK || "${WALLET_PK}"],
          triage: [],
          community: [window.WALLET_PK || "${WALLET_PK}"],
          verified: [window.WALLET_PK || "${WALLET_PK}"],
        };
      }

      export async function getProposal(projectKey, proposalId) {
        return ${JSON.stringify(MOCK_PROPOSAL)};
      }

      export async function hasAnonymousVotingConfig(projectName) {
        return false;
      }
    `;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // Mock @service alias for ReadContractService
  await page.route("**/@service/ReadContractService*", async (route) => {
    const body = `
      // Mock ReadContractService functions via @service alias
      export async function getProjectFromName(name) {
        if (window.getProjectFromName) {
          return window.getProjectFromName(name);
        }
        // For new project names, return null to indicate they don't exist
        if (name === "testproject123" || name === "newproject" || name === "flowtest") {
          return null;
        }
        // For existing project names, return the project data
        return { name: "demo", maintainers: ["G".padEnd(56, "A")], config: { url: "https://github.com/test/demo", ipfs: "abc123" } };
      }

      export async function getProjectFromId(id) {
        return { name: "demo", maintainers: ["G".padEnd(56, "A")], config: { url: "https://github.com/test/demo", ipfs: "abc123" } };
      }

      export async function getMember(address) {
        return { address, badges: [], meta: "test member" };
      }

      export async function getProject(projectKey) {
        return { name: "demo", maintainers: ["G".padEnd(56, "A")], config: { url: "https://github.com/test/demo", ipfs: "abc123" } };
      }

      export async function getProjectHash(projectKey) {
        return "abc123";
      }

      export async function getBadges(projectKey) {
        return {
          community: false,
          developer: false,
          triage: false,
          verified: false
        };
      }

      export async function getProposalPages(projectName) {
        if (window.getProposalPages) {
          return window.getProposalPages(projectName);
        }
        return 1;
      }

      export async function getProposals(projectName, page) {
        if (window.getProposals) {
          return window.getProposals(projectName, page);
        }
        return [];
      }

      export async function hasAnonymousVotingConfig(projectName) {
        return false;
      }
    `;
    route.fulfill({
      status: 200,
      body,
      headers: { "content-type": "application/javascript" },
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
    const js = `export const kit = { 
      signTransaction: async (xdr) => ({ signedTxXdr: typeof xdr === 'string' ? xdr : String(xdr) }),
      getAddress: async () => ({ address: '${WALLET_PK}' }),
      isConnected: async () => true,
      requestAccess: async () => true,
      signAuthEntry: async () => ({ signedAuthEntry: 'mock', signerAddress: '${WALLET_PK}' }),
      signMessage: async () => ({ signature: 'mock', signerAddress: '${WALLET_PK}' }),
      getNetwork: async () => ({ network: 'testnet' }),
      setWallet: async (walletId) => {
        console.log('Mock setWallet called with:', walletId);
        return true;
      }
    };`;
    route.fulfill({
      status: 200,
      body: js,
      headers: { "content-type": "application/javascript" },
    });
  });

  // Mock stellar-wallets-kit package to prevent @stellar/freighter-api import errors
  await page.route("**/@creit.tech/stellar-wallets-kit*", async (route) => {
    const body = `
      // Mock stellar-wallets-kit to avoid @stellar/freighter-api import errors
      export const allowAllModules = () => [];
      export const FREIGHTER_ID = 'freighter';
      export class StellarWalletsKit {
        constructor(config) {
          this.config = config;
        }
        async signTransaction(xdr) {
          return { signedTxXdr: typeof xdr === 'string' ? xdr : String(xdr) };
        }
        async getAddress() {
          return { address: '${WALLET_PK}' };
        }
        async isConnected() {
          return true;
        }
        async requestAccess() {
          return true;
        }
        async signAuthEntry() {
          return { signedAuthEntry: 'mock', signerAddress: '${WALLET_PK}' };
        }
        async signMessage() {
          return { signature: 'mock', signerAddress: '${WALLET_PK}' };
        }
        async getNetwork() {
          return { network: 'testnet' };
        }
        async setWallet(walletId) {
          console.log('Mock setWallet called with:', walletId);
          return true;
        }
      }
      
      export class LedgerModule {
        constructor() {}
        async signTransaction(xdr) {
          return { signedTxXdr: typeof xdr === 'string' ? xdr : String(xdr) };
        }
        async getAddress() {
          return { address: '${WALLET_PK}' };
        }
        async isConnected() {
          return true;
        }
        async requestAccess() {
          return true;
        }
        async signAuthEntry() {
          return { signedAuthEntry: 'mock', signerAddress: '${WALLET_PK}' };
        }
        async signMessage() {
          return { signature: 'mock', signerAddress: '${WALLET_PK}' };
        }
        async getNetwork() {
          return { network: 'testnet' };
        }
        async setWallet(walletId) {
          console.log('Mock setWallet called with:', walletId);
          return true;
        }
      }
    `;
    route.fulfill({
      status: 200,
      body,
      headers: { "content-type": "application/javascript" },
    });
  });

  // Mock stellar-wallets-kit at multiple import paths
  await page.route("**/components/stellar-wallets-kit*", async (route) => {
    const js = `export const kit = { 
      signTransaction: async (xdr) => ({ signedTxXdr: typeof xdr === 'string' ? xdr : String(xdr) }),
      getAddress: async () => ({ address: '${WALLET_PK}' }),
      isConnected: async () => true,
      requestAccess: async () => true,
      signAuthEntry: async () => ({ signedAuthEntry: 'mock', signerAddress: '${WALLET_PK}' }),
      signMessage: async () => ({ signature: 'mock', signerAddress: '${WALLET_PK}' }),
      getNetwork: async () => ({ network: 'testnet' }),
      setWallet: async (walletId) => {
        console.log('Mock setWallet called with:', walletId);
        return true;
      }
    };`;
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
      getAddress: async () => ({ address: "${WALLET_PK}" }),
      isConnected: async () => true,
      requestAccess: async () => true,
      signAuthEntry: async () => ({
        signedAuthEntry: "mock",
        signerAddress: "${WALLET_PK}",
      }),
      signMessage: async () => ({
        signature: "mock",
        signerAddress: "${WALLET_PK}",
      }),
      getNetwork: async () => ({ network: "testnet" }),
      setWallet: async (walletId) => {
        console.log("Mock setWallet called with:", walletId);
        return true;
      },
    };
  });

  // Apply walletService mock before navigating to provide authenticated user for tests
  await page.route("**/src/service/walletService.ts", (route) => {
    const body = `
    export function loadedPublicKey() { return '${WALLET_PK}'; }
    export function loadedProvider() { return { id: 'mockWallet', name: 'Mock Wallet', connected: true }; }
    export function setPublicKey() {}
    export function setConnection() {}      
    export function disconnect() {}
    export function initializeConnection() { return { success: true }; }
  `;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // Also mock the wallet service with the @service alias pattern
  await page.route("**/@service/walletService*", (route) => {
    const body = `
    export function loadedPublicKey() { return '${WALLET_PK}'; }
    export function loadedProvider() { return { id: 'mockWallet', name: 'Mock Wallet', connected: true }; }
    export function setPublicKey() {}
    export function setConnection() {}      
    export function disconnect() {}
    export function initializeConnection() { return { success: true }; }
  `;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // ──────────────────────────────────────────────
  // GitHub raw content (README / TOML)
  // ──────────────────────────────────────────────
  await page.route("https://raw.githubusercontent.com/**", (route) => {
    const url = route.request().url();
    if (url.includes("tansu.toml")) {
      const toml = `name = "${MOCK_PROJECT.name}"
description = "${MOCK_PROJECT.description}"
url = "${MOCK_PROJECT.config_url}"
`;
      route.fulfill({ status: 200, body: toml });
    } else {
      route.fulfill({ status: 200, body: "# Mock README\nTest" });
    }
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

  // Mock delegation endpoint for uploads (Cloudflare Worker)
  await page.route(/(ipfs.*\.tansu\.dev|ipfs-delegation.*\.workers\.dev)/, (route) => {
    // Use the same mock CAR archive as in stubDelegation
    const mockCarBytes = new Uint8Array([
      // CAR v1 header
      0x0a,
      0xa1,
      0x67,
      0x76,
      0x65,
      0x72,
      0x73,
      0x69,
      0x6f,
      0x6e,
      0x01,
      // Root CID (simplified)
      0x12,
      0x20,
      // Add 32 bytes for the CID hash
      ...Array(32).fill(0x01),
      // Add minimal block data
      0x24, // varint for block size
      0x12,
      0x20, // CID prefix
      ...Array(32).fill(0x02), // block CID
      0x08, // block data size
      ...Array(8).fill(0x03), // block data
    ]);

    route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: mockCarBytes,
    });
  });

  // Stub w3up client so uploadDirectory returns the same CID as calculateDirectoryCid
  await page.route("**/@storacha/client*", async (route) => {
    const js = `export const create = async () => ({ agent: { did: () => 'did:test' }, addSpace: async () => ({ did: () => 'did:test' }), setCurrentSpace: async () => {}, uploadDirectory: async () => ({ toString: () => 'bafytestcidmock' }) });`;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body: js,
    });
  });

  // Stub delegation extract to always return ok
  await page.route("**/@@storacha/client/delegation*", async (route) => {
    const js = `export const extract = async () => ({ ok: {} });`;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body: js,
    });
  });

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
      setWallet: async (walletId) => {
        console.log("Mock setWallet called with:", walletId);
        return true;
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
      // Diagnostic logging removed for production
    }
    route.continue();
  });

  // Mock with logging
  await page.route("https://raw.githubusercontent.com/**", (route) => {
    route.fulfill({ status: 200, body: "# Mock README\nTest" });
  });

  await page.route("**/soroban/**", (route) => {
    route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
  });

  // Enhanced wallet kit for debugging
  await page.addInitScript(() => {
    window.addEventListener("walletConnected", (event) => {
      const connectBtn = document.querySelector("[data-connect] span");
      if (connectBtn) connectBtn.textContent = "Profile";
    });

    window.addEventListener("walletDisconnected", () => {
      const connectBtn = document.querySelector("[data-connect] span");
      if (connectBtn) connectBtn.textContent = "Connect";
    });

    // Add setWallet to diagnostic window.kit if needed
    if (window.kit && !window.kit.setWallet) {
      window.kit.setWallet = async (walletId) => {
        console.log("Mock setWallet called with:", walletId);
        return true;
      };
    }
  });
}
