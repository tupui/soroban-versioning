// crypto utility for anonymous voting (recreated)
// Provides RSA-OAEP key-pair generation and base-64 helpers.

// Generate a 2048-bit RSA-OAEP key pair and return base-64 strings.
export async function generateRSAKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const [pubBuf, privBuf] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);
  return { publicKey: bufToB64(pubBuf), privateKey: bufToB64(privBuf) };
}

export async function encryptWithPublicKey(
  plaintext: string,
  publicKeyB64: string,
): Promise<string> {
  const key = await importPublicKey(publicKeyB64);
  const enc = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, enc);
  return bufToB64(cipher);
}

export async function decryptWithPrivateKey(
  cipherB64: string,
  privateKeyB64: string,
): Promise<string> {
  const key = await importPrivateKey(privateKeyB64);
  const cipherBuf = b64ToBuf(cipherB64);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    key,
    cipherBuf,
  );
  return new TextDecoder().decode(plainBuf);
}

// ────────────────── helpers ──────────────────
function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
}

async function importPublicKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    b64ToBuf(b64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );
}

async function importPrivateKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    b64ToBuf(b64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"],
  );
}
