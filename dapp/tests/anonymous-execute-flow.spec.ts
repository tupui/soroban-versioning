import { test, expect } from "@playwright/test";

// Verifies that the dapp passes the weighted tallies and seeds to the contract
// execute method for anonymous proposals.

test("execute() receives weighted tallies/seeds for anonymous proposal", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Minimal stub of Tansu client with execute capturing arguments
    (window as any).__captured = { executeArgs: null };

    (window as any).__tansuClient = {
      options: { publicKey: "G".padEnd(56, "A") },
      async get_proposal() {
        // Anonymous proposal with one vote to keep execute focused
        const V = {
          address: "G".padEnd(56, "A"),
          weight: 3,
          encrypted_votes: ["1", "0", "0"], // approve
          encrypted_seeds: ["10", "0", "0"],
          commitments: [
            new Uint8Array(96),
            new Uint8Array(96),
            new Uint8Array(96),
          ],
        };
        return {
          result: {
            id: 7,
            ipfs: "",
            status: { tag: "Active", values: undefined },
            title: "x",
            vote_data: {
              public_voting: false,
              voting_ends_at: Math.floor(Date.now() / 1000) - 10, // past (so execute path allowed)
              votes: [{ tag: "AnonymousVote", values: [V] }],
            },
          },
        } as any;
      },
      async get_max_weight() {
        return { result: 3 } as any;
      },
      async proof() {
        return { result: true } as any;
      },
      async execute({ tallies, seeds }: any) {
        (window as any).__captured.executeArgs = { tallies, seeds };
        return { result: { tag: "Approved", values: undefined } } as any;
      },
    };
  });

  // Stub the Soroban contract client
  await page.route("**/src/contracts/soroban_tansu.ts", (route) => {
    const body = `export default (globalThis).__tansuClient;`;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // Stub ContractService execute to just forward to the mocked client
  await page.route("**/src/service/ContractService.ts", (route) => {
    const body = `
      export async function execute(project_name, proposal_id, tallies, seeds){
        const c = (globalThis).__tansuClient;
        if (!c?.options?.publicKey) c.options = { publicKey: 'G'.padEnd(56,'A') };
        return c.execute({ tallies, seeds });
      }
      export { execute as executeProposal };
    `;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // Stub wallet kit so signing path is never reached (we only test argument wiring)
  await page.route("**/src/components/stellar-wallets-kit.ts", (route) => {
    const body = `export const kit = { signTransaction: async (xdr) => ({ signedTxXdr: xdr }) };`;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // Stub walletService to provide a connected Mock wallet
  await page.route("**/src/service/walletService.ts", (route) => {
    const body = `
      export function loadedPublicKey(){ return 'G'.padEnd(56,'A'); }
      export function loadedProvider(){ return 'freighter'; }
      export function setConnection(){}
      export function setPublicKey(){}
      export function disconnect(){}
      export function initializeConnection(){}
    `;
    route.fulfill({
      status: 200,
      headers: { "content-type": "application/javascript" },
      body,
    });
  });

  // Navigate to the app
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Compute tallies and seeds, then call execute()
  const { ok } = await page.evaluate(async () => {
    const utils = await import("../src/utils/anonymousVoting.ts");
    const svc = await import("../src/service/ContractService.ts");
    const data = await utils.computeAnonymousVotingData(
      "demo",
      7,
      "dummy",
      true,
    );
    await svc.execute("demo", 7, data.tallies, data.seeds);
    return { ok: true };
  });

  expect(ok).toBeTruthy();
  const captured = await page.evaluate(() => (window as any).__captured);

  // From one voter:
  // vote = 1 * weight(3) => tallies [3, 0, 0]
  // seed = 10 * weight(3) => seeds [30, 0, 0]
  expect(captured.executeArgs.tallies).toEqual([3n, 0n, 0n]);
  expect(captured.executeArgs.seeds).toEqual([30n, 0n, 0n]);
});
