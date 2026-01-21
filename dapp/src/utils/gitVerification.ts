import { Buffer } from "buffer";

export interface GitProvider {
  name: string;
  keysUrl: (username: string) => string;
}

export const GIT_PROVIDERS: Record<string, GitProvider> = {
  github: {
    name: "GitHub",
    keysUrl: (username: string) => `https://github.com/${username}.keys`,
  },
  gitlab: {
    name: "GitLab",
    keysUrl: (username: string) => `https://gitlab.com/${username}.keys`,
  },
};

export interface ParsedGitHandle {
  provider: string;
  username: string;
}

export function parseGitHandle(gitHandle: string): ParsedGitHandle | null {
  const match = gitHandle.match(/^([^:]+):(.+)$/);
  if (!match) return null;
  
  const [, provider, username] = match;
  if (!provider || !username || !GIT_PROVIDERS[provider]) return null;
  
  return { provider, username };
}

export async function fetchGitPublicKeys(gitHandle: string): Promise<string[]> {
  const parsed = parseGitHandle(gitHandle);
  if (!parsed) {
    throw new Error("Invalid Git handle format. Use provider:username (e.g., github:alice)");
  }

  const provider = GIT_PROVIDERS[parsed.provider];
  if (!provider) {
    throw new Error(`Unsupported provider: ${parsed.provider}`);
  }

  const originalUrl = provider.keysUrl(parsed.username);
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch keys from ${provider.name}: ${response.statusText}`);
    }

    const keysText = await response.text();
    const keys = keysText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .filter(line => line.startsWith('ssh-ed25519'));

    if (keys.length === 0) {
      throw new Error(`No Ed25519 keys found for ${gitHandle}`);
    }

    return keys;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch Git public keys: ${error}`);
  }
}

export function extractEd25519PublicKey(sshKey: string): Buffer {
  const parts = sshKey.split(' ');
  if (parts.length < 2 || parts[0] !== 'ssh-ed25519') {
    throw new Error('Invalid SSH Ed25519 key format');
  }

  const keyPart = parts[1];
  if (!keyPart) {
    throw new Error('Missing key data in SSH key');
  }

  try {
    const keyData = Buffer.from(keyPart, 'base64');
    const keyType = keyData.subarray(4, 15).toString();
    if (keyType !== 'ssh-ed25519') {
      throw new Error('Key type mismatch');
    }
    
    const publicKey = keyData.subarray(19, 51);
    if (publicKey.length !== 32) {
      throw new Error('Invalid Ed25519 public key length');
    }
    
    return publicKey;
  } catch (error) {
    throw new Error(`Failed to extract Ed25519 public key: ${error}`);
  }
}

export function generateRandomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createSEP53Envelope(
  networkPassphrase: string,
  signingAccount: string,
  contractId: string,
  gitHandle: string
): string {
  const nonce = generateRandomNonce();
  const payload = `tansu-bind|${contractId}|${gitHandle}`;
  
  return [
    "Stellar Signed Message",
    networkPassphrase,
    signingAccount,
    nonce,
    payload
  ].join('\n');
}

export function parseSEP53Envelope(envelope: string): {
  header: string;
  networkPassphrase: string;
  signingAccount: string;
  nonce: string;
  payload: string;
} {
  const lines = envelope.split('\n');
  if (lines.length !== 5) {
    throw new Error('Invalid SEP-53 envelope format: must have exactly 5 lines');
  }

  const [header, networkPassphrase, signingAccount, nonce, payload] = lines;
  
  if (!header || header !== "Stellar Signed Message") {
    throw new Error('Invalid SEP-53 envelope: header must be "Stellar Signed Message"');
  }

  if (!networkPassphrase) {
    throw new Error('Invalid SEP-53 envelope: missing network passphrase');
  }

  if (!signingAccount) {
    throw new Error('Invalid SEP-53 envelope: missing signing account');
  }

  if (!nonce || !/^[0-9a-f]{32}$/i.test(nonce)) {
    throw new Error('Invalid SEP-53 envelope: nonce must be 32 hex characters');
  }

  if (!payload || !payload.startsWith('tansu-bind|')) {
    throw new Error('Invalid SEP-53 envelope: payload must start with "tansu-bind|"');
  }

  return { header, networkPassphrase, signingAccount, nonce, payload };
}

export async function verifyEd25519Signature(
  publicKey: Buffer,
  message: string,
  signature: Buffer
): Promise<boolean> {
  try {
    const { verify } = await import('@noble/ed25519');
    const messageBytes = new TextEncoder().encode(message);
    return await verify(signature, messageBytes, publicKey);
  } catch (error) {
    console.error('Ed25519 verification failed:', error);
    return false;
  }
}

export function generateSSHSignCommand(envelope: string, privateKeyPath?: string): string {
  const keyPath = privateKeyPath || '~/.ssh/id_ed25519';
  return `echo -n "${envelope.replace(/"/g, '\\"')}" | ssh-keygen -Y sign -f ${keyPath} -n file /dev/stdin`;
}

export function generateGPGSignCommand(envelope: string): string {
  return `printf "%s" "${envelope.replace(/"/g, '\\"')}" | gpg --clear-sign --detach-sig --armor`;
}

export function parseSSHSignature(signatureText: string): Buffer {
  const match = signatureText.match(
    /-----BEGIN SSH SIGNATURE-----([\s\S]*?)-----END SSH SIGNATURE-----/i
  );

  if (!match || !match[1]?.trim()) {
    throw new Error("Cannot find valid BEGIN/END SSH SIGNATURE markers");
  }

  const base64Only = match[1]
    .replace(/[^A-Za-z0-9+/=]/g, '')    
    .trim();

  if (base64Only.length < 100) {
    throw new Error(`Base64 content too short after cleaning (${base64Only.length} chars)`);
  }

  let data: Buffer;
  try {
    data = Buffer.from(base64Only, 'base64');
  } catch (err) {
    throw new Error(
      `Base64 decode failed: ${err instanceof Error ? err.message : String(err)}\n` +
      `Base64 length was: ${base64Only.length} chars`
    );
  }

  console.log("[DEBUG] Decoded signature size:", data.length, "bytes"); 

  if (data.length < 100 || data.length > 300) {
    throw new Error(`Unrealistic decoded size for SSH signature: ${data.length} bytes`);
  }

  let offset = 0;

  const readUint32 = () => {
    if (offset + 4 > data.length) {
      throw new Error(`Out of bounds reading length field at offset ${offset}`);
    }
    const v = data.readUInt32BE(offset);
    offset += 4;
    return v;
  };

  const readString = () => {
    const len = readUint32();
    if (offset + len > data.length) {
      throw new Error(
        `String length exceeds buffer at offset ${offset}: ` +
        `claimed ${len}, remaining ${data.length - offset}`
      );
    }
    const str = data.subarray(offset, offset + len).toString('utf8');
    offset += len;
    return str;
  };

  const readBlob = () => {
    const len = readUint32();
    if (offset + len > data.length) {
      throw new Error(
        `Blob length exceeds buffer at offset ${offset}: ` +
        `claimed ${len}, remaining ${data.length - offset}`
      );
    }
    const buf = data.subarray(offset, offset + len);
    offset += len;
    return buf;
  };

  const magic = readString();
  if (magic !== "SSHSIG") {
    throw new Error(`Wrong magic header: expected "SSHSIG", got "${magic}"`);
  }

  readUint32(); 

  readBlob();         
  readString();         
  readBlob();           
  readString();       

  const signature = readBlob(); 

  if (signature.length !== 64) {
    throw new Error(`Expected 64-byte Ed25519 signature, got ${signature.length} bytes`);
  }

  return signature;
}

export interface GitVerificationData {
  gitHandle: string;
  publicKey: Buffer;
  envelope: string;
  signature: Buffer;
}

export async function validateGitVerification(
  data: GitVerificationData,
  expectedNetworkPassphrase: string,
  expectedSigningAccount: string,
  expectedContractId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const parsed = parseSEP53Envelope(data.envelope.trim());
    if (parsed.networkPassphrase !== expectedNetworkPassphrase) {
      return { valid: false, error: 'Network passphrase mismatch' };
    }
    if (parsed.signingAccount !== expectedSigningAccount) {
      return { valid: false, error: 'Signing account mismatch' };
    }
    const payloadParts = parsed.payload.split('|');
    if (payloadParts.length !== 3 || payloadParts[0] !== 'tansu-bind') {
      return { valid: false, error: 'Invalid payload format' };
    }
    if (payloadParts[1] !== expectedContractId) {
      return { valid: false, error: 'Contract ID mismatch' };
    }
    if (payloadParts[2] !== data.gitHandle) {
      return { valid: false, error: 'Git handle mismatch' };
    }
    const signatureValid = await verifyEd25519Signature(
      data.publicKey,
      data.envelope.trim(),
      data.signature
    );
    if (!signatureValid) {
      return { valid: false, error: 'Invalid signature' };
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}
