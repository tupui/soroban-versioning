import { test, expect } from "@playwright/test";

// This test validates the anonymous proof computation end-to-end in the browser
// by stubbing the Tansu client module that the app dynamically imports.

test.describe("Anonymous voting – proof computation", () => {
  test("compute tallies/seeds (weighted) and call proof with those arrays", async ({
    page,
  }) => {
    // --- STUB TANSU CLIENT ---
    await page.addInitScript(() => {
      const V1 = {
        address: "GA".padEnd(56, "A"),
        weight: 5,
        encrypted_votes: ["1", "0", "0"],
        encrypted_seeds: ["7", "8", "9"],
        commitments: [
          new Uint8Array(96),
          new Uint8Array(96),
          new Uint8Array(96),
        ],
      };
      const V2 = {
        address: "GB".padEnd(56, "B"),
        weight: 2,
        encrypted_votes: ["0", "1", "0"],
        encrypted_seeds: ["3", "4", "5"],
        commitments: [
          new Uint8Array(96),
          new Uint8Array(96),
          new Uint8Array(96),
        ],
      };
      const V3 = {
        address: "GC".padEnd(56, "C"),
        weight: 1,
        encrypted_votes: ["0", "0", "1"],
        encrypted_seeds: ["1", "1", "1"],
        commitments: [
          new Uint8Array(96),
          new Uint8Array(96),
          new Uint8Array(96),
        ],
      };

      (window as any).__captured = { proofArgs: null };

      (window as any).__tansuClient = {
        options: {},
        async get_proposal() {
          return {
            result: {
              id: 1,
              ipfs: "",
              status: { tag: "Active", values: undefined },
              title: "t",
              vote_data: {
                public_voting: false,
                voting_ends_at: Math.floor(Date.now() / 1000) + 3600,
                votes: [
                  { tag: "AnonymousVote", values: [V1] },
                  { tag: "AnonymousVote", values: [V2] },
                  { tag: "AnonymousVote", values: [V3] },
                ],
              },
            },
          } as any;
        },
        async get_max_weight({ member_address }: { member_address: string }) {
          const map: Record<string, number> = {
            [V1.address as string]: V1.weight,
            [V2.address as string]: V2.weight,
            [V3.address as string]: V3.weight,
          };
          return { result: map[member_address] ?? 1 } as any;
        },
        async proof({
          tallies,
          seeds,
        }: {
          tallies: bigint[];
          seeds: bigint[];
        }) {
          (window as any).__captured.proofArgs = { tallies, seeds };
          return { result: true } as any;
        },
      };
    });

    // --- MOCK IMPORTS ---
    await page.route("**/src/contracts/soroban_tansu.ts", (route) => {
      const body = `export default (globalThis).__tansuClient;`;
      route.fulfill({
        status: 200,
        headers: { "content-type": "application/javascript" },
        body,
      });
    });

    // --- MOCK WALLET SERVICE ---
    await page.route("**/src/service/walletService.ts", (route) => {
      const body = `
    export function loadedPublicKey() { 
      return 'G'.padEnd(56,'A'); 
    }

    export function loadedProvider() { 
      // Simulate a connected Freighter wallet
      return { id: 'freighter', name: 'Freighter', connected: true }; 
    }

    export function setConnection() {}
    export function disconnect() {}
    export function initializeConnection() {}
  `;
      route.fulfill({
        status: 200,
        headers: { "content-type": "application/javascript" },
        body,
      });
    });

    // --- RUN THE TEST ---
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const { tallies, seeds } = await page.evaluate(async () => {
      const mod = await import("../src/utils/anonymousVoting.ts");
      const data = await mod.computeAnonymousVotingData(
        "demo",
        1,
        "dummy",
        true,
      );
      return { tallies: data.tallies, seeds: data.seeds };
    });

    expect(tallies).toEqual([5n, 2n, 1n]);
    expect(seeds).toEqual([42n, 49n, 56n]);

    const captured = await page.evaluate(() => (window as any).__captured);
    expect(captured.proofArgs.tallies).toEqual(tallies);
    expect(captured.proofArgs.seeds).toEqual(seeds);
  });
});
