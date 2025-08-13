import { test, expect } from "@playwright/test";

// This test validates the anonymous proof computation end-to-end in the browser
// by stubbing the Tansu client module that the app dynamically imports.

test.describe("Anonymous voting – proof computation", () => {
  test("compute tallies/seeds (weighted) and call proof with those arrays", async ({
    page,
  }) => {
    // Install a stub Tansu client before any module import happens in the page
    await page.addInitScript(() => {
      // Three voters with different weights and choices
      const V1 = {
        address: "GA".padEnd(56, "A"),
        weight: 5,
        encrypted_votes: ["1", "0", "0"], // approve
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
        encrypted_votes: ["0", "1", "0"], // reject
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
        encrypted_votes: ["0", "0", "1"], // abstain
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
          tallies: number[];
          seeds: number[];
        }) {
          (window as any).__captured.proofArgs = { tallies, seeds };
          return { result: true } as any;
        },
      };
    });

    // Serve the stub for the module import path used by the app
    await page.route("**/src/contracts/soroban_tansu.ts", (route) => {
      const body = `export default (globalThis).__tansuClient;`;
      route.fulfill({
        status: 200,
        headers: { "content-type": "application/javascript" },
        body,
      });
    });

    // Navigate to any page (module imports available). Then import the utility and run it.
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const { tallies, seeds } = await page.evaluate(async () => {
      const mod = await import("/src/utils/anonymousVoting.ts");
      const data = await mod.computeAnonymousVotingData(
        "demo",
        1,
        "dummy",
        true,
      );
      return { tallies: data.tallies, seeds: data.seeds };
    });

    // Expected weighted tallies: [5,2,1]
    expect(tallies).toEqual([5, 2, 1]);

    // Seeds are aggregated per option with weights applied:
    // V1 seeds [7,8,9]*5 → [35,40,45]
    // V2 seeds [3,4,5]*2 → [6,8,10]
    // V3 seeds [1,1,1]*1 → [1,1,1]
    // Sum → [42,49,56]
    expect(seeds).toEqual([42, 49, 56]);

    // Ensure the same arrays were used for the proof call
    const captured = await page.evaluate(() => (window as any).__captured);
    expect(captured.proofArgs.tallies).toEqual(tallies);
    expect(captured.proofArgs.seeds).toEqual(seeds);
  });
});
