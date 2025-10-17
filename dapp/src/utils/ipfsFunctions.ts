/**
 * IPFS utility functions
 *
 * This file contains all utility functions for working with IPFS links and data.
 */

import toml from "toml";

// Cache for IPFS content to avoid repeated network requests
const ipfsCache: Record<string, any> = {};

/**
 * Get the basic IPFS gateway link for a CID
 *
 * @param cid - The IPFS content identifier
 * @returns The gateway URL for the content
 */
export const getIpfsBasicLink = (cid: string): string => {
  if (!cid) return "";

  // Validate CID format before constructing URL
  const validCidPattern = /^(bafy|Qm)[a-zA-Z0-9]{44,}$/;
  if (!validCidPattern.test(cid)) {
    // Invalid CID format is a normal case, silently return empty string
    return "";
  }

  return `https://w3s.link/ipfs/${cid}`;
};

/**
 * Get the proposal data link from IPFS
 *
 * @param cid - The IPFS content identifier
 * @returns The gateway URL for the proposal data
 */
export const getProposalLinkFromIpfs = (cid: string): string => {
  if (!cid) return "";
  return `${getIpfsBasicLink(cid)}/proposal.md`;
};

/**
 * Get the outcome data link from IPFS
 *
 * @param cid - The IPFS content identifier
 * @returns The gateway URL for the outcome data
 */
export const getOutcomeLinkFromIpfs = (cid: string): string => {
  if (!cid) return "";
  return `${getIpfsBasicLink(cid)}/outcomes.json`;
};

/**
 * Compute the CID that IPFS / Web3.Storage would assign to a directory without uploading it.
 * Uses createDirectoryEncoderStream from ipfs-car to create the same UnixFS + DAG-PB layout
 * that @storacha/client would use.
 *
 * @param files - Array of File objects or objects with path and content
 * @returns The calculated CID
 */
export const calculateDirectoryCid = async (
  files: File[] | { path: string; content: Uint8Array }[],
): Promise<string> => {
  try {
    // For simple File[] inputs, use the more efficient implementation
    if (Array.isArray(files) && files.length > 0 && files[0] instanceof File) {
      const { createDirectoryEncoderStream, CAREncoderStream } = await import(
        "ipfs-car"
      );

      // We only need the root CID, not the full CAR, so we'll track blocks
      let rootCID: any;

      // Create a stream that encodes the directory structure
      const stream = createDirectoryEncoderStream(files as File[]);

      // Create a transform to capture the last block (which will be the root)
      const captureRoot = new TransformStream({
        transform(block: any, controller) {
          rootCID = block.cid;
          controller.enqueue(block);
        },
      });

      // Create a writable that discards the CAR data (we only need the CID)
      const discard = new WritableStream({
        write() {
          // Discard the data
        },
      });

      // Process the stream to get the root CID
      await stream
        .pipeThrough(captureRoot)
        .pipeThrough(new CAREncoderStream())
        .pipeTo(discard);

      if (!rootCID) {
        throw new Error("Failed to compute CID: no root block found");
      }

      return rootCID.toString();
    }
    // For more complex inputs, use the original implementation that supports custom objects
    else {
      // Dynamically import the IPFS libraries to reduce initial bundle size
      const { create } = await import("@storacha/client");
      const client = await create();

      // Convert the files array to the format expected by the uploadDirectory method
      const filesArray =
        Array.isArray(files) && files.length > 0 && files[0] instanceof File
          ? (files as File[]).map((file) => ({
              name: file.name,
              stream: () => file.stream(),
            }))
          : (files as { path: string; content: Uint8Array }[]).map((file) => ({
              name: file.path,
              stream: () =>
                new ReadableStream({
                  start(controller) {
                    controller.enqueue(file.content);
                    controller.close();
                  },
                }),
            }));

      // Calculate CID without uploading
      const dirCid = await client.uploadDirectory(filesArray);
      return dirCid.toString();
    }
  } catch (error) {
    // This is a truly unexpected error during CID calculation
    // Keep this log since it's a critical operation that shouldn't fail
    console.error("Error calculating directory CID:", error);
    throw error;
  }
};

/**
 * Fetches content from IPFS with caching
 *
 * @param url - The IPFS URL to fetch from
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds
 * @returns The response from the fetch
 */
export const fetchFromIPFS = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000,
): Promise<Response> => {
  // Return from cache if available
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  if (ipfsCache[cacheKey]) {
    // Clone the cached response to ensure it can be used multiple times
    return ipfsCache[cacheKey].clone();
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Cache successful responses
    if (response.ok) {
      // Clone the response before caching it
      ipfsCache[cacheKey] = response.clone();
    }

    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/**
 * Fetches and parses JSON data from IPFS with caching
 *
 * @param url - The IPFS URL to fetch JSON from
 * @param options - Fetch options
 * @returns The parsed JSON data
 */
export const fetchJSONFromIPFS = async (
  url: string,
  options: RequestInit = {},
): Promise<any> => {
  // Skip empty or invalid URLs
  if (!url) {
    return null;
  }

  try {
    const response = await fetchFromIPFS(url, options);
    if (!response.ok) {
      // Not finding content is a normal case for IPFS, silently return null
      return null;
    }
    return await response.json();
  } catch {
    // Network errors or parsing errors are expected cases, silently return null
    return null;
  }
};

/**
 * Fetches and parses a TOML file (e.g. `tansu.toml`) from a directory CID on IPFS.
 * The TOML file must live at the root of the directory.
 *
 * @param cid - The directory CID that contains the `tansu.toml` file
 * @returns The parsed TOML data or `undefined` if not found / parse error
 */
export const fetchTomlFromCid = async (
  cid: string,
): Promise<any | undefined> => {
  if (!cid) return undefined;

  try {
    const url = `${getIpfsBasicLink(cid)}/tansu.toml`;
    const response = await fetchFromIPFS(url);

    if (!response.ok) return undefined;

    const text = await response.text();
    return toml.parse(text);
  } catch (_) {
    // Parsing or network errors are considered expected – return undefined so callers can fallback.
    return undefined;
  }
};
