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

const SUBPROJECT_KEY_BYTES = 32;

/**
 * Normalizes a single sub-project key to a Buffer.
 * Keys from the SDK may be Buffer, Uint8Array (XDR decode), or hex string.
 */
function toProjectKeyBuffer(key: Buffer | Uint8Array | string): Buffer {
  if (Buffer.isBuffer(key)) return key;
  if (typeof key === "string") return Buffer.from(key, "hex");
  return Buffer.from(key);
}

/**
 * Raw result shape for get_sub_projects (Tansu).
 * Bindings declare AssembledTransaction<Array<Buffer>> (Vec<Bytes>). Some
 * decoders return a single Buffer/Uint8Array when the vec has one element.
 */
export type GetSubProjectsRawResult =
  | Array<Buffer>
  | Buffer
  | Uint8Array
  | null
  | undefined;

/**
 * Normalizes get_sub_projects result to an array of 32-byte key Buffers.
 * Handles the binding type Array<Buffer> and the single-key decoder quirk.
 */
export function normalizeSubProjectKeys(
  result: GetSubProjectsRawResult,
): Buffer[] {
  if (result == null) return [];
  if (Array.isArray(result)) {
    return result.map((k) => toProjectKeyBuffer(k));
  }
  const buf = Buffer.isBuffer(result)
    ? result
    : result instanceof Uint8Array
      ? Buffer.from(result)
      : null;
  if (!buf || buf.length === 0) return [];
  if (buf.length === SUBPROJECT_KEY_BYTES) return [buf];
  const keys: Buffer[] = [];
  for (let i = 0; i < buf.length; i += SUBPROJECT_KEY_BYTES) {
    keys.push(Buffer.from(buf.subarray(i, i + SUBPROJECT_KEY_BYTES)));
  }
  return keys;
}
