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

/**
 * Normalize a sub-project key from get_sub_projects to a Buffer.
 * The SDK can return Buffer, Uint8Array (from XDR decode), or hex string.
 */
export function toProjectKeyBuffer(key: Buffer | Uint8Array | string): Buffer {
  if (Buffer.isBuffer(key)) return key;
  if (typeof key === "string") return Buffer.from(key, "hex");
  return Buffer.from(key);
}
