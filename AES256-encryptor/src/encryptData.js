// A helper function to convert ArrayBuffers to base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// A helper function to convert ArrayBuffers to Hex
function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate a new AES-GCM key (32-byte key)
export async function generateKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts given data using the provided AES-GCM key.
 * @param {CryptoKey} key - The AES-GCM key.
 * @param {Uint8Array} data - The plaintext data to encrypt.
 * @param {Uint8Array} header - Additional authenticated data.
 * @returns {Object} payload containing nonce, header, ciphertext, tag
 */
export async function encryptData(key, data, header) {
  // Generate a random nonce (nonce)
  const nonce = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      additionalData: header,
      tagLength: 128,
    },
    key,
    data,
  );

  // The encrypted result includes the ciphertext and tag together in AES-GCM.
  // The last 16 bytes of the encrypted data are the tag.
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const tag = encryptedBytes.slice(encryptedBytes.length - 16);

  const payload = {
    nonce: arrayBufferToBase64(nonce.buffer),
    header: arrayBufferToBase64(header.buffer),
    ciphertext: arrayBufferToBase64(ciphertext.buffer),
    tag: arrayBufferToBase64(tag.buffer),
  };

  return payload;
}

export async function getKeyHex(key) {
  const rawKey = await window.crypto.subtle.exportKey("raw", key);
  const keyHex = arrayBufferToHex(rawKey);

  return keyHex;
}

export async function getKeyBase64(key) {
  const rawKey = await window.crypto.subtle.exportKey("raw", key);
  const keyBase64 = arrayBufferToBase64(rawKey);

  return keyBase64;
}
