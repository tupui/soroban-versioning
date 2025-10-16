import { bls12_381 } from "@noble/curves/bls12-381.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

/**
 * Result of a vote processing operation
 */
export interface VoteResult {
  /** The commitment bytes representing the vote and random value */
  commitment: Uint8Array;
}

/**
 * Process a vote with a random value to create a commitment using BLS12-381 curve
 *
 * This function creates a Pedersen commitment of the form C = vG + rH where:
 * - v is the vote value
 * - r is a random value for hiding the vote
 * - G and H are independent generator points on the BLS12-381 curve
 *
 * @param vote - The vote value to commit (can be positive or negative)
 * @param randomValue - Random value to use for hiding the vote
 * @returns VoteResult containing the commitment as compressed bytes
 * @throws Error if vote processing fails
 */
export function processVote(vote: number, randomValue: number): VoteResult {
  try {
    // Convert to BigInts and ensure they're positive
    const randomBI = BigInt(randomValue);

    // Generate deterministic base points from hash values
    const G = bls12_381.G1.hashToCurve(
      sha256(utf8ToBytes("VOTING_BASEPOINT_G_2024_v1")),
      { DST: utf8ToBytes("VOTING_G") },
    );

    const H = bls12_381.G1.hashToCurve(
      sha256(utf8ToBytes("VOTING_BASEPOINT_H_2024_v1")),
      { DST: utf8ToBytes("VOTING_H") },
    );

    // Handle negative votes by computing modular negation in the scalar field
    const voteBI = BigInt(vote);
    const vote_ =
      vote < 0 ? bls12_381.fields.Fr.sub(BigInt(0), -voteBI) : voteBI;

    // Calculate commitment = vG + rH (Pedersen commitment)
    const vG = G.multiply(vote_);
    const rH = H.multiply(randomBI);
    const commitment = vG.add(rH);

    // Convert commitment to compressed format (48 bytes)
    // @ts-ignore - toRawBytes exists in implementation
    const commitmentBytes = commitment.toRawBytes(true);

    return {
      commitment: commitmentBytes,
    };
  } catch (error) {
    throw new Error(
      `Failed to process vote: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

// Example usage (commented out for production)
/*
const vote = 1;
const random = 123456;
const result = processVote(vote, random);
const commitmentHex = Buffer.from(result.commitment).toString("hex");
console.log("Commitment (hex):", commitmentHex);
*/
