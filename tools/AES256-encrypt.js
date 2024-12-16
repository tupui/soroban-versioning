import { writeFileSync } from "fs";
import { webcrypto } from "crypto";

const { subtle } = webcrypto;

function arrayBufferToBase64(buffer) {
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateKey() {
  return subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(key, data, header) {
  // Generate a random nonce (12 bytes for AES-GCM)
  const nonce = new Uint8Array(12);
  webcrypto.getRandomValues(nonce);

  const encrypted = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      additionalData: header,
      tagLength: 128,
    },
    key,
    data
  );

  const encryptedBytes = new Uint8Array(encrypted);
  // Last 16 bytes are the authentication tag
  const tag = encryptedBytes.slice(encryptedBytes.length - 16);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);

  return {
    nonce: arrayBufferToBase64(nonce.buffer),
    header: arrayBufferToBase64(header.buffer),
    ciphertext: arrayBufferToBase64(ciphertext.buffer),
    tag: arrayBufferToBase64(tag.buffer),
  };
}

async function getKeyHex(key) {
  const rawKey = await subtle.exportKey("raw", key);
  return arrayBufferToHex(rawKey);
}

(async () => {
  const data = new TextEncoder().encode("This is some secret data...");  // This is our data to encrypt.
  const header = new TextEncoder().encode("storachaProof");

  const key = await generateKey();
  const keyHex = await getKeyHex(key);
  console.log("This is our key in hex:", keyHex);

  const payload = await encryptData(key, data, header);

  writeFileSync("encrypted_proof.bin", JSON.stringify(payload, null, 4), "utf8");
  console.log("Encrypted data written to encrypted_proof.bin");
})();
