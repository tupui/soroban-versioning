import { Buffer } from "buffer";
import * as pkg from "js-sha3";

const { keccak256 } = pkg;

/**
 * Derive the canonical project key from a project name.
 * Always lowercases the name before hashing to ensure consistent IDs across the app.
 */
export function deriveProjectKey(projectName: string): Buffer {
  return Buffer.from(
    keccak256.create().update(projectName.toLowerCase()).digest(),
  );
}
