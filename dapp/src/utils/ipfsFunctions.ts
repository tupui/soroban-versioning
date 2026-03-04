/** IPFS gateway and fetch helpers. */

import toml from "toml";

const ipfsCache: Record<string, any> = {};
const VALID_CID_PATTERN = /^(bafy|Qm)[a-zA-Z0-9]{44,}$/;
const STORACHA_URL_PATTERN = /^https:\/\/([^/]+)\.ipfs\.storacha\.link(\/.*)?$/;

const IPFS_GATEWAYS: ReadonlyArray<{
  name: string;
  retries: number;
  buildUrl: (cid: string, path: string) => string;
}> = [
  {
    name: "storacha",
    retries: 2,
    buildUrl: (cid, path) => `https://${cid}.ipfs.storacha.link${path}`,
  },
  {
    name: "filebase",
    retries: 2,
    buildUrl: (cid, path) => `https://ipfs.filebase.io/ipfs/${cid}${path}`,
  },
];

const PER_ATTEMPT_TIMEOUT_MS = 4000;

export const getIpfsBasicLink = (cid: string): string => {
  if (!cid) return "";
  if (!VALID_CID_PATTERN.test(cid)) {
    return "";
  }
  return IPFS_GATEWAYS[0]!.buildUrl(cid, "");
};

export const getProposalLinkFromIpfs = (cid: string): string => {
  if (!cid) return "";
  return `${getIpfsBasicLink(cid)}/proposal.md`;
};

export const getOutcomeLinkFromIpfs = (cid: string): string => {
  if (!cid) return "";
  return `${getIpfsBasicLink(cid)}/outcomes.json`;
};

export const calculateDirectoryCid = async (files: File[]): Promise<string> => {
  const { createDirectoryEncoderStream, CAREncoderStream } = await import(
    "ipfs-car"
  );

  let rootCID: any;

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

  if (!rootCID) {
    throw new Error("Failed to compute CID: no root block found");
  }

  return rootCID.toString();
};

function parseStorachaUrl(url: string): { cid: string; path: string } | null {
  const match = url.match(STORACHA_URL_PATTERN);
  if (!match) return null;
  return { cid: match[1]!, path: match[2] ?? "" };
}

async function fetchOne(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const fetchFromIPFS = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000,
): Promise<Response> => {
  const parsed = parseStorachaUrl(url);

  if (parsed) {
    const contentCacheKey = `ipfs:${parsed.cid}${parsed.path}`;
    if (ipfsCache[contentCacheKey]) {
      return ipfsCache[contentCacheKey].clone();
    }

    const attemptTimeout = Math.min(timeout, PER_ATTEMPT_TIMEOUT_MS);
    let lastError: unknown;
    let gatewayIndex = 0;
    for (const gateway of IPFS_GATEWAYS) {
      for (let attempt = 0; attempt < gateway.retries; attempt++) {
        try {
          const gatewayUrl = gateway.buildUrl(parsed.cid, parsed.path);
          const response = await fetchOne(gatewayUrl, options, attemptTimeout);
          if (response.ok) {
            ipfsCache[contentCacheKey] = response.clone();
            return response;
          }
          lastError = new Error(`HTTP ${response.status}`);
        } catch (err) {
          lastError = err;
        }
      }
      const next = IPFS_GATEWAYS[gatewayIndex + 1];
      if (next && import.meta.env?.DEV) {
        console.warn(
          `[IPFS] Gateway "${gateway.name}" failed, trying ${next.name}`,
        );
      }
      gatewayIndex++;
    }
    throw lastError;
  }

  const cacheKey = `${url}-${JSON.stringify(options)}`;
  if (ipfsCache[cacheKey]) {
    return ipfsCache[cacheKey].clone();
  }
  const response = await fetchOne(url, options, timeout);
  if (response.ok) {
    ipfsCache[cacheKey] = response.clone();
  }
  return response;
};

export const fetchJSONFromIPFS = async (
  url: string,
  options: RequestInit = {},
): Promise<any> => {
  if (!url) {
    return null;
  }

  try {
    const response = await fetchFromIPFS(url, options);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

export const fetchTomlFromCid = async (
  cid: string,
  timeoutMs: number = 5000,
): Promise<any | undefined> => {
  if (!cid) return undefined;

  try {
    const url = `${getIpfsBasicLink(cid)}/tansu.toml`;
    const response = await fetchFromIPFS(url, {}, timeoutMs);

    if (!response.ok) return undefined;

    const text = await response.text();
    return toml.parse(text);
  } catch (_) {
    return undefined;
  }
};
