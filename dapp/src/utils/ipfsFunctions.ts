/** IPFS gateway and fetch helpers. Single retrieval path: CID + path → cache → gateways. */

import toml from "toml";

const VALID_CID_PATTERN = /^(bafy|Qm)[a-zA-Z0-9]{44,}$/;

type IpfsCache = {
  responses: Record<string, Response>;
  toml: Record<string, any>;
  json: Record<string, any>;
};

function getGlobalIpfsCache(): IpfsCache {
  if (typeof window === "undefined") {
    return { responses: {}, toml: {}, json: {} };
  }
  const w = window as Window & { __TANSU_IPFS_CACHE__?: IpfsCache };
  if (!w.__TANSU_IPFS_CACHE__) {
    w.__TANSU_IPFS_CACHE__ = { responses: {}, toml: {}, json: {} };
  }
  return w.__TANSU_IPFS_CACHE__;
}

const GATEWAYS: ReadonlyArray<{
  name: string;
  buildUrl: (cid: string, path: string) => string;
}> = [
  {
    name: "filebase",
    buildUrl: (cid, path) => `https://ipfs.filebase.io/ipfs/${cid}${path}`,
  },
  {
    name: "storacha",
    buildUrl: (cid, path) => `https://${cid}.ipfs.storacha.link${path}`,
  },
];

const CACHE_KEY_PREFIX = "ipfs:v3:";
const DEFAULT_IPFS_TIMEOUT_MS = 8000;
const PER_ATTEMPT_MS = 2000;

export type FetchFromIpfsOptions = {
  timeoutMs?: number;
};

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function cacheKey(cid: string, path: string): string {
  return `${CACHE_KEY_PREFIX}${cid}${normalizePath(path)}`;
}

async function fetchOne(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

/**
 * Core IPFS fetch: CID + path. Checks cache; on miss tries gateway 1 then gateway 2.
 * All retrieval in the app goes through this or a wrapper that calls it.
 */
export async function fetchFromIpfs(
  cid: string,
  path: string,
  options: FetchFromIpfsOptions = {},
): Promise<Response> {
  if (!cid || !VALID_CID_PATTERN.test(cid)) {
    throw new Error("Invalid IPFS CID");
  }
  const pathNorm = normalizePath(path);
  const timeoutMs = options.timeoutMs ?? DEFAULT_IPFS_TIMEOUT_MS;

  const cache = getGlobalIpfsCache();
  const key = cacheKey(cid, pathNorm);
  const cached = cache.responses[key];
  if (cached) return cached.clone();

  const attemptMs = Math.min(timeoutMs, PER_ATTEMPT_MS);
  let lastError: unknown;

  for (let i = 0; i < GATEWAYS.length; i++) {
    const gateway = GATEWAYS[i]!;
    try {
      const res = await fetchOne(
        gateway.buildUrl(cid, pathNorm),
        {},
        attemptMs,
      );
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      // Only accept when the final response body is readable (outcome of redirect), not just status
      try {
        const verifyClone = res.clone();
        await verifyClone.arrayBuffer();
      } catch (bodyErr) {
        lastError = bodyErr;
        continue;
      }
      cache.responses[key] = res.clone();
      return res;
    } catch (err) {
      lastError = err;
    }
    const next = GATEWAYS[i + 1];
    if (import.meta.env?.DEV && next) {
      console.warn(`[IPFS] ${gateway.name} failed, trying ${next.name}`);
    }
  }

  throw lastError ?? new Error("IPFS fetch failed");
}

/**
 * Fetch IPFS content as text (e.g. markdown). Uses core fetch; no separate text cache.
 */
export async function fetchTextFromIpfs(
  cid: string,
  path: string,
  options: FetchFromIpfsOptions = {},
): Promise<string | null> {
  try {
    const res = await fetchFromIpfs(cid, path, options);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Fetch IPFS content as JSON. Uses core fetch; caches parsed JSON by (cid, path).
 */
export async function fetchJsonFromIpfs(
  cid: string,
  path: string,
  options: FetchFromIpfsOptions = {},
): Promise<any | null> {
  if (!cid || !VALID_CID_PATTERN.test(cid)) return null;
  const pathNorm = normalizePath(path);
  const cache = getGlobalIpfsCache();
  const key = cacheKey(cid, pathNorm);
  const cached = cache.json[key];
  if (cached !== undefined) return cached;

  try {
    const res = await fetchFromIpfs(cid, pathNorm, options);
    if (!res.ok) return null;
    const data = await res.json();
    cache.json[key] = data;
    return data;
  } catch {
    return null;
  }
}

const TANSU_TOML_PATH = "/tansu.toml";

/**
 * Fetch and parse project tansu.toml from IPFS. Caches parsed result by CID.
 */
export async function fetchTomlFromIpfs(
  cid: string,
  options: FetchFromIpfsOptions = {},
): Promise<any | undefined> {
  if (!cid || !VALID_CID_PATTERN.test(cid)) return undefined;

  const cache = getGlobalIpfsCache();
  const cachedToml = cache.toml[cid];
  if (cachedToml !== undefined) return cachedToml;

  try {
    const text = await fetchTextFromIpfs(cid, TANSU_TOML_PATH, options);
    if (!text?.trim()) return undefined;

    const data = toml.parse(text);
    if (
      !data ||
      (typeof data === "object" &&
        !(data as any).DOCUMENTATION &&
        !(data as any).ACCOUNTS)
    ) {
      return undefined;
    }
    cache.toml[cid] = data;
    return data;
  } catch {
    return undefined;
  }
}

/** @deprecated Use fetchTomlFromIpfs. Kept for compatibility. */
export const fetchTomlFromCid = fetchTomlFromIpfs;

// --- URL helpers (display only; do not use for fetch) ---

export const getIpfsBasicLink = (cid: string): string => {
  if (!cid || !VALID_CID_PATTERN.test(cid)) return "";
  return GATEWAYS[0]!.buildUrl(cid, "");
};

/** Build gateway URL for CID and optional path (e.g. for links). */
export function getIpfsUrl(cid: string, path: string = ""): string {
  if (!cid || !VALID_CID_PATTERN.test(cid)) return "";
  const pathNorm = path ? normalizePath(path) : "";
  return GATEWAYS[0]!.buildUrl(cid, pathNorm);
}

export const getProposalLinkFromIpfs = (cid: string): string =>
  getIpfsUrl(cid, "/proposal.md");

export const getOutcomeLinkFromIpfs = (cid: string): string =>
  getIpfsUrl(cid, "/outcomes.json");

export const calculateDirectoryCid = async (files: File[]): Promise<string> => {
  const { createDirectoryEncoderStream, CAREncoderStream } =
    await import("ipfs-car");

  let rootCID: { toString(): string } | undefined;

  const stream = createDirectoryEncoderStream(files);

  const captureRoot = new TransformStream({
    transform(block: any, controller) {
      rootCID = block.cid;
      controller.enqueue(block);
    },
  });

  const discard = new WritableStream({
    write() {},
  });

  await stream
    .pipeThrough(captureRoot)
    .pipeThrough(new CAREncoderStream())
    .pipeTo(discard);

  if (!rootCID) throw new Error("Failed to compute CID: no root block found");
  return rootCID.toString();
};
