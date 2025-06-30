// src/service/OnChainActivityService.ts
// New service that exposes a single public helper `fetchOnChainActions` to
// retrieve, parse and return on-chain contract interactions for a given
// Stellar account. The implementation deliberately keeps a *single* Horizon
// request per `accountId` and uses an in-memory cache to map project keys to
// their human-readable names provided by the calling component.

import { Buffer } from "buffer";
import { xdr, StrKey } from "@stellar/stellar-sdk";
import pkgSha3 from "js-sha3";
import { MEMBER_METHODS } from "../constants/onchain";

const { keccak_256 } = pkgSha3;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Generic representation of a member-facing contract call.
 */
export interface OnChainAction {
  /** Transaction hash. */
  txHash: string;
  /** Unix timestamp in **milliseconds**. */
  timestamp: number;
  /** Contract method invoked (register, commit, …). */
  method: string;
  /** Hex-encoded project key if relevant; `null` for `register`. */
  projectKey: string | null;
  /** Human-friendly project name – derived from the cache, may be `null`. */
  projectName: string | null;
  /** Method-specific details extracted from the arguments (hash, badges, …). */
  details: Record<string, unknown>;
  /** The raw Horizon operation record – used for collapsible debug view. */
  raw: unknown;
}

// -----------------------------------------------------------------------------
// Internal state & helpers
// -----------------------------------------------------------------------------

/** In-memory cache mapping *hex-encoded* project key → project name. */
const PROJECT_CACHE = new Map<string, string>();

/**
 * Allow the UI to seed the cache ahead of the network request.
 */
export function seedProjectNameCache(mapping: Record<string, string>): void {
  Object.entries(mapping).forEach(([k, v]) => {
    PROJECT_CACHE.set(normalizeHex(k)!, v);
  });
}

/** Convert Soroban network identifier → Horizon base URL. */
function horizonBase(net: string): string {
  return net === "public" || net === "mainnet" || net === "publicnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

/** Decode base64 ScVal using stellar-sdk xdr utilities and convert to JS */
function decodeScVal(b64: string): any {
  try {
    const scVal = xdr.ScVal.fromXDR(b64, "base64");
    return scValToNative(scVal);
  } catch {
    return null;
  }
}

function scValToNative(val: any): any {
  switch (val.switch().name) {
    case "scvSymbol":
      return { sym: val.sym().toString() };
    case "scvString":
      return { str: val.str().toString() };
    case "scvBytes":
      return { bin: val.bytes().toString("base64") };
    case "scvVec":
      return { vec: val.vec().map((v: any) => scValToNative(v)) };
    case "scvI64":
      return { i64: Number(val.i64().toString()) };
    case "scvU32":
      return { u32: val.u32() };
    case "scvU64":
      return { u64: Number(val.u64().toString()) };
    case "scvI32":
      return { i32: val.i32() };
    case "scvAddress": {
      try {
        const addr = val.address();
        if (addr.switch().name === "scAddressTypeAccount") {
          const raw = Buffer.from(addr.accountId().ed25519());
          return { address: StrKey.encodeEd25519PublicKey(raw) };
        }
      } catch {}
      return {};
    }
    default:
      return {};
  }
}

// Cache fetched actions per account to guarantee at most one network call per
// page-life. Key = accountId.
const ACTIONS_CACHE = new Map<string, Promise<OnChainAction[]>>();

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Fetch *at most once* from Horizon, filter member-facing contract calls and
 * return a parsed list ordered by descending timestamp (latest first).
 */
export async function fetchOnChainActions(
  accountId: string,
): Promise<OnChainAction[]> {
  if (ACTIONS_CACHE.has(accountId)) {
    return ACTIONS_CACHE.get(accountId)!;
  }

  const fetchPromise = (async (): Promise<OnChainAction[]> => {
    const base = horizonBase(import.meta.env.SOROBAN_NETWORK || "testnet");
    const url = `${base}/accounts/${accountId}/operations?limit=200&order=desc`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Horizon error ${resp.status}: ${resp.statusText}`);
    }
    const payload = await resp.json();
    const records: any[] = payload?._embedded?.records ?? [];

    const actions: OnChainAction[] = [];
    const memberSet = new Set(MEMBER_METHODS);

    const decodeParam = (p: any): any => {
      if (!p) return null;
      const b64: string | undefined = p.xdr || p.value;
      if (!b64 || typeof b64 !== "string") return null;
      return decodeScVal(b64);
    };

    for (const rec of records) {
      // We only care about Soroban contract calls.
      if (
        rec.type !== "invoke_host_function" ||
        !Array.isArray(rec.parameters) ||
        rec.parameters.length < 2
      ) {
        continue;
      }

      const decodedParams = rec.parameters.map(decodeParam);

      const methodSym = decodedParams[1]?.sym ?? null;
      if (!methodSym || !memberSet.has(methodSym)) continue;

      // Arguments vector is usually param[2].vec
      let argVals: any[] = [];
      if (decodedParams.length >= 3 && Array.isArray(decodedParams[2]?.vec)) {
        argVals = decodedParams[2].vec;
      } else if (decodedParams.length > 2) {
        argVals = decodedParams.slice(2);
      }

      let projectKey: string | null = null;
      let projectName: string | null = null;
      const details: Record<string, unknown> = {};

      const args = argVals;

      // Always keep a raw snapshot so the UI can list every parameter without
      // custom mapping.
      details.params = args;

      // Capture tx-level XDR for eye icon if operation-level missing later
      const txLevelXdr: string | null = rec.transaction_xdr ?? null;

      switch (methodSym) {
        case "register": {
          projectName = paramToString(args[1]); // name is arg1 (maintainer is arg0)
          if (projectName) {
            // keccak key (derived) – used by some off-chain calls
            const keyHex = normalizeHex(keccak_256(projectName.toLowerCase()));
            PROJECT_CACHE.set(keyHex!, projectName);
            details.name = projectName;

            // The contract returns the canonical project_key (Bytes) in the
            // transaction result – decode and cache it so on-chain calls that
            // use the raw key (add_member, commit, …) can resolve the name.
            if (rec.result_xdr) {
              const res = decodeScVal(rec.result_xdr);
              const binHex = paramBytesToHex(res);
              if (binHex) {
                PROJECT_CACHE.set(binHex, projectName);
                projectKey = binHex;
              }
            }
          }
          break;
        }
        case "commit": {
          projectKey = paramBytesToHex(args[1]); // arg0 maintainer, arg1 key
          details.hash = paramToString(args[2]);
          break;
        }
        case "update_config": {
          projectKey = paramBytesToHex(args[1]);
          details.url = paramToString(args[3]);
          details.hash = paramToString(args[4]);
          break;
        }
        case "add_member": {
          // Membership registration – no project key; first arg is the member address
          details.member = paramToString(args[0]);
          // Meta hash for IPFS may be arg1; store it for UI
          details.meta = paramToString(args[1]);
          break;
        }
        case "add_badges": {
          projectKey = paramBytesToHex(args[1]);
          details.member = paramToString(args[2]);
          const badgeVecObj = args[3];
          details.badges = extractBadgeInts(badgeVecObj);
          break;
        }
        case "create_proposal": {
          projectKey = paramBytesToHex(args[1]);
          details.title = paramToString(args[2]);
          break;
        }
        case "vote":
        case "execute": {
          projectKey = paramBytesToHex(args[1]);
          details.proposalId = Number(paramToString(args[2]));
          break;
        }
      }

      // Generic detection – if projectKey not yet set, find first bytes/hex
      if (!projectKey) {
        for (const av of args) {
          const hex = paramBytesToHex(av);
          if (hex && hex.length === 64) {
            // 32 bytes
            projectKey = hex;
            break;
          }
        }
      }

      if (projectKey && projectName) {
        PROJECT_CACHE.set(normalizeHex(projectKey)!, projectName);
      }

      actions.push({
        txHash: rec.transaction_hash,
        timestamp: Date.parse(rec.created_at),
        method: methodSym,
        projectKey,
        projectName,
        details,
        raw: { ...rec, __tx_xdr: txLevelXdr },
      });
    }

    // Second pass – fill in any missing project names (e.g. when a commit
    // operation appears *before* the register call in the descending list).
    for (const a of actions) {
      if (a.projectKey && a.projectName) {
        PROJECT_CACHE.set(normalizeHex(a.projectKey)!, a.projectName);
      }
      if (!a.projectName && a.projectKey) {
        const name = lookupProjectName(a.projectKey);
        if (name) a.projectName = name;
      }
    }

    return actions;
  })();

  ACTIONS_CACHE.set(accountId, fetchPromise);
  return fetchPromise;
}

// helper to extract string from param
function paramToString(arg: any): string | null {
  if (!arg) return null;
  if (typeof arg === "string" || typeof arg === "number") return String(arg);
  if (typeof arg.str === "string") return arg.str;
  if (typeof arg.address === "string") return arg.address;
  if (typeof arg.sym === "string") return arg.sym;
  if (typeof arg.value === "string") return arg.value;
  if (
    typeof arg.i64 === "number" ||
    typeof arg.u64 === "number" ||
    typeof arg.i32 === "number" ||
    typeof arg.u32 === "number"
  ) {
    return String(arg.i64 ?? arg.u64 ?? arg.i32 ?? arg.u32);
  }
  return null;
}

function paramBytesToHex(arg: any): string | null {
  const b64 = arg?.bin ?? arg?.bytes ?? arg?.value;
  if (!b64) return null;
  try {
    return Buffer.from(b64, "base64").toString("hex");
  } catch {
    return null;
  }
}

function extractBadgeInts(vecObj: any): number[] {
  if (!vecObj || !Array.isArray(vecObj.vec)) return [];
  return vecObj.vec
    .map((v: any) => {
      if (typeof v.u32 === "number") return v.u32;
      if (typeof v.u64 === "number") return v.u64;
      if (typeof v.i32 === "number") return v.i32;
      if (typeof v.i64 === "number") return v.i64;
      return null;
    })
    .filter((n: any): n is number => n !== null);
}

// helper
function normalizeHex(hex: string | null): string | null {
  if (!hex) return null;
  return hex.toLowerCase().padStart(64, "0");
}

function lookupProjectName(hexKey: string | null): string | null {
  if (!hexKey) return null;
  const raw = hexKey.toLowerCase();
  const norm = normalizeHex(raw);
  const trimmed = raw.replace(/^0+/, "");
  return (
    PROJECT_CACHE.get(norm!) ??
    PROJECT_CACHE.get(raw) ??
    PROJECT_CACHE.get(trimmed) ??
    null
  );
}
