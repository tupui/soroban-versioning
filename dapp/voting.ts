import { sha256 } from "@noble/hashes/sha256";
import { bls12_381 } from "@noble/curves/bls12-381";

interface VoteResult {
  commitment: Uint8Array; // The commitment bytes
}

/**
 * Process a vote with a random value to create a commitment
 * @param vote The vote value
 * @param randomValue Random value to use for commitment
 * @returns VoteResult containing the commitment
 */
function processVote(vote: number, randomValue: number): VoteResult {
  try {
    // Convert to BigInts and ensure they're positive
    const randomBI = BigInt(randomValue);

    // Generate deterministic base points
    const G = bls12_381.G1.hashToCurve(sha256("VOTING_BASEPOINT_G_2024_v1"), {
      DST: "VOTING_G",
    });
    const H = bls12_381.G1.hashToCurve(sha256("VOTING_BASEPOINT_H_2024_v1"), {
      DST: "VOTING_H",
    });

    const voteBI = BigInt(vote);
    const vote_ =
      vote < 0 ? bls12_381.fields.Fr.sub(BigInt(0), -voteBI) : voteBI;

    // Calculate commitment = Gv + Hr
    const vG = G.multiply(vote_);
    const rH = H.multiply(randomBI);

    const commitment = vG.add(rH);

    // Convert commitment to compressed format (48 bytes)
    // @ts-ignore
    const commitmentBytes = commitment.toRawBytes(true);

    return {
      commitment: commitmentBytes,
    };
  } catch (error) {
    throw new Error(
      `Failed to process vote: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// Example usage (commented out for production)
/*
const vote = 1;
const random = 123456;
const result = processVote(vote, random);
const commitmentHex = Buffer.from(result.commitment).toString("hex");
*/

export { processVote, type VoteResult };
