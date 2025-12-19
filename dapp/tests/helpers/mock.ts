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
  await page.route(
    /(ipfs.*\.tansu\.dev|ipfs-delegation.*\.workers\.dev)/,
    (route) => {
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
    },
  );
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

export async function applyAllMocks(page: any) {
  // Existing mocks here...

  await page.addInitScript(() => {
    // Mock checkAndNotifyFunding so it does nothing during tests
    (window as any).checkAndNotifyFunding = async () => {
      console.log("🧪 Mocked checkAndNotifyFunding called");
    };

    // Mock getWalletHealth so tests don't depend on real wallet
    (window as any).getWalletHealth = async () => ({
      exists: true,
      balance: 100,
    });
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
