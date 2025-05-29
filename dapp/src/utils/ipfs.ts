/**
 * Compute the CID that IPFS / Web3.Storage would assign to a directory without uploading it.
 * This relies on creating the same UnixFS + DAG-PB layout that `client.uploadDirectory`
 * from `@web3-storage/w3up-client` applies internally.
 *
 * The function is intentionally tiny and self-contained so that it can be reused
 * from both the proposal and member flows.
 */
export async function calculateDirectoryCid(files: File[]): Promise<string> {
  const {
    createFileEncoderStream,
    createDirectoryEncoderStream,
    CAREncoderStream,
  } = await import("ipfs-car");

  // We only need the root CID, not the full CAR, so we'll track blocks
  let rootCID: any;

  // Create a stream that encodes the directory structure
  const stream = createDirectoryEncoderStream(files);

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
