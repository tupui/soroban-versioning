import { promises as fs } from "fs";

export default async function decryptProof(keyHex: string): Promise<string> {
  const key = await getKeyFromHex(keyHex);
  const fileContent = await fs.readFile("encrypted_proof.bin", "utf-8");
  const payload: {
    nonce: string;
    header: string;
    ciphertext: string;
    tag: string;
  } = JSON.parse(fileContent);

  const decrypted = await decryptData(key, payload);
  return new TextDecoder().decode(decrypted);
}

async function getKeyFromHex(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToArrayBuffer(keyHex);
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  return key;
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return byteArray.buffer;
}

function atob(base64: string): string {
  return Buffer.from(base64, "base64").toString("binary");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function decryptData(
  key: CryptoKey,
  payload: { nonce: string; header: string; ciphertext: string; tag: string },
): Promise<Uint8Array> {
  const nonce = new Uint8Array(base64ToArrayBuffer(payload.nonce));
  const header = new Uint8Array(base64ToArrayBuffer(payload.header));
  const ciphertext = new Uint8Array(base64ToArrayBuffer(payload.ciphertext));
  const tag = new Uint8Array(base64ToArrayBuffer(payload.tag));

  const encryptedCombined = new Uint8Array(ciphertext.length + tag.length);
  encryptedCombined.set(ciphertext, 0);
  encryptedCombined.set(tag, ciphertext.length);

  const decrypted = await globalThis.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      additionalData: header,
      tagLength: 128,
    },
    key,
    encryptedCombined.buffer,
  );

  return new Uint8Array(decrypted);
}
