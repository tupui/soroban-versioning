/** IPFS gateway and fetch helpers. */

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
const PER_ATTEMPT_MS = 2000;

function parseContentFromUrl(
  url: string,
): { cid: string; path: string } | null {
  const storacha = url.match(
    /^https:\/\/([^/]+)\.ipfs\.storacha\.link(\/.*)?$/,
  );
  if (storacha?.[1]) return { cid: storacha[1], path: storacha[2] ?? "" };

  const filebase = url.match(
    /^https:\/\/ipfs\.filebase\.io\/ipfs\/([^/]+)(\/.*)?$/,
  );
  if (filebase?.[1]) return { cid: filebase[1], path: filebase[2] ?? "" };

  return null;
}

export const getIpfsBasicLink = (cid: string): string => {
  if (!cid || !VALID_CID_PATTERN.test(cid)) return "";
  return GATEWAYS[0]!.buildUrl(cid, "");
};

export const getProposalLinkFromIpfs = (cid: string): string => {
  const base = getIpfsBasicLink(cid);
  return base ? `${base}/proposal.md` : "";
};

export const getOutcomeLinkFromIpfs = (cid: string): string => {
  const base = getIpfsBasicLink(cid);
  return base ? `${base}/outcomes.json` : "";
};

export const calculateDirectoryCid = async (files: File[]): Promise<string> => {
  const { createDirectoryEncoderStream, CAREncoderStream } = await import(
    "ipfs-car"
  );

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
      redirect: "manual",
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function fetchByCidPath(
  cid: string,
  path: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const cache = getGlobalIpfsCache();
  const key = `${CACHE_KEY_PREFIX}${cid}${path}`;
  const cached = cache.responses[key];
  if (cached) return cached.clone();

  const attemptMs = Math.min(timeoutMs, PER_ATTEMPT_MS);
  let lastError: unknown;

  for (let i = 0; i < GATEWAYS.length; i++) {
    const gateway = GATEWAYS[i]!;
    try {
      const res = await fetchOne(
        gateway.buildUrl(cid, path),
        options,
        attemptMs,
      );
      if (res.ok) {
        cache.responses[key] = res.clone();
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
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

export const fetchFromIPFS = async (
  urlOrCid: string,
  options: RequestInit = {},
  timeoutMs: number = 8000,
): Promise<Response> => {
  const parsed = parseContentFromUrl(urlOrCid);

  if (parsed) {
    return fetchByCidPath(parsed.cid, parsed.path, options, timeoutMs);
  }

  const cache = getGlobalIpfsCache();
  const key = `${CACHE_KEY_PREFIX}url:${urlOrCid}`;
  const cached = cache.responses[key];
  if (cached) return cached.clone();

  const res = await fetchOne(
    urlOrCid,
    options,
    Math.min(timeoutMs, PER_ATTEMPT_MS),
  );
  if (res.ok) cache.responses[key] = res.clone();
  return res;
};

export const fetchJSONFromIPFS = async (
  url: string,
  options: RequestInit = {},
): Promise<any> => {
  if (!url) return null;
  const cache = getGlobalIpfsCache();
  const parsed = parseContentFromUrl(url);
  const contentKey = parsed
    ? `${CACHE_KEY_PREFIX}${parsed.cid}${parsed.path}`
    : null;
  if (contentKey) {
    const cached = cache.json[contentKey];
    if (cached !== undefined) return cached;
  }
  try {
    const res = await fetchFromIPFS(url, options);
    if (!res.ok) return null;
    const data = await res.json();
    if (contentKey) cache.json[contentKey] = data;
    return data;
  } catch {
    return null;
  }
};

export const fetchTomlFromCid = async (
  cid: string,
  timeoutMs: number = 4000,
): Promise<any | undefined> => {
  if (!cid || !VALID_CID_PATTERN.test(cid)) return undefined;

  const cache = getGlobalIpfsCache();
  const cachedToml = cache.toml[cid];
  if (cachedToml !== undefined) return cachedToml;

  try {
    const res = await fetchByCidPath(cid, "/tansu.toml", {}, timeoutMs);
    if (!res.ok) return undefined;

    const text = await res.text();
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
};
