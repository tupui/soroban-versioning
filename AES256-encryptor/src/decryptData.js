function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function hexToArrayBuffer(hex) {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    byteArray[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return byteArray.buffer;
}

/**
 * Decrypts the given payload using the provided AES-GCM key.
 * @param {CryptoKey} key - The AES-GCM key
 * @param {Object} payload - The JSON payload with nonce, header, ciphertext, tag
 * @returns {Uint8Array} plaintext
 */
export async function decryptData(key, payload) {
  const nonce = new Uint8Array(base64ToArrayBuffer(payload.nonce));
  const header = new Uint8Array(base64ToArrayBuffer(payload.header));
  const ciphertext = new Uint8Array(base64ToArrayBuffer(payload.ciphertext));
  const tag = new Uint8Array(base64ToArrayBuffer(payload.tag));

  // In AES-GCM, the tag is appended at the end of ciphertext,
  // so we must recombine them before decrypting.
  const encryptedCombined = new Uint8Array(ciphertext.length + tag.length);
  encryptedCombined.set(ciphertext, 0);
  encryptedCombined.set(tag, ciphertext.length);

  const decrypted = await window.crypto.subtle.decrypt(
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

export async function getKeyFromHex(keyHex) {
  const keyBytes = hexToArrayBuffer(keyHex);
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    true, // extractable (can be set to false in production if you don't need to export it)
    ["encrypt", "decrypt"],
  );

  return key;
}

export async function getKeyFromBase64(keyBase64) {
  const keyBytes = base64ToArrayBuffer(keyBase64);
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    true, // extractable (can be set to false in production if you don't need to export it)
    ["encrypt", "decrypt"],
  );

  return key;
}
