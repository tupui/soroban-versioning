import { Buffer } from "buffer";

export interface GitProvider {
    name: string;
    keysUrl: (username: string) => string;
}

export const GIT_PROVIDERS: Record<string, GitProvider> = {
    github: {
        name: "GitHub",
        keysUrl: (username: string) => `https://api.github.com/users/${username}/keys`,
    },
    gitlab: {
        name: "GitLab",
        keysUrl: (username: string) => `https://gitlab.com/api/v4/users/${username}/keys`,
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

    try {
        const response = await fetch(originalUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch keys from ${provider.name}: ${response.statusText}`);
        }

        const keysArray = await response.json();
        const keys = keysArray.map((key: any) => key.key);

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
    publicKey: Uint8Array,
    message: string | Uint8Array,
    signature: Uint8Array
): Promise<boolean> {
    try {
        const { verifyAsync, hashes } = await import('@noble/ed25519');

        // @noble/ed25519 v3 requires manual SHA-512 registration
        // We use Web Crypto API to avoid extra dependencies
        if (!hashes.sha512Async) {
            (hashes as any).sha512Async = async (...msgs: Uint8Array[]) => {
                const combined = new Uint8Array(msgs.reduce((len, m) => len + m.length, 0));
                let offset = 0;
                for (const m of msgs) {
                    combined.set(m, offset);
                    offset += m.length;
                }
                const hashBuffer = await crypto.subtle.digest('SHA-512', combined);
                return new Uint8Array(hashBuffer);
            };
        }

        const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
        console.log('Verifying signature against blob:', messageBytes);
        return await verifyAsync(signature, messageBytes, publicKey);
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

/**
 * Parses an OpenSSH format signature
 * format: https://github.com/openssh/openssh-portable/blob/master/PROTOCOL.sshsig
 */
export function parseSSHSignature(signatureText: string): {
    signature: Buffer;
    hashAlgorithm: string;
    namespace: string;
} {
    try {
        // 1. Remove armor headers
        const lines = signatureText.trim().split('\n');
        const contentLines = lines.filter(line =>
            !line.startsWith('-----BEGIN') && !line.startsWith('-----END')
        );
        const base64Data = contentLines.join('');
        const data = Buffer.from(base64Data, 'base64');

        let offset = 0;

        function readUint32(): number {
            if (offset + 4 > data.length) throw new Error('Buffer underrun reading uint32');
            const val = data.readUint32BE(offset);
            offset += 4;
            return val;
        }

        function readBuffer(): Buffer {
            const len = readUint32();
            if (offset + len > data.length) throw new Error('Buffer underrun reading buffer');
            const buf = data.subarray(offset, offset + len);
            offset += len;
            return buf;
        }

        // SSHSIG Magic (6 bytes)
        const magic = data.subarray(offset, offset + 6).toString();
        if (magic !== 'SSHSIG') throw new Error(`Invalid magic: ${magic}`);
        offset += 6;

        // Version (uint32)
        const version = readUint32();
        if (version !== 1) throw new Error(`Unsupported version: ${version}`);

        // Public key (string) - skip
        readBuffer();

        // Namespace (string)
        const namespace = readBuffer().toString();

        // Reserved (string) - skip
        readBuffer();

        // Hash algorithm (string)
        const hashAlgorithm = readBuffer().toString();

        // Signature (string)
        const sigBlob = readBuffer();

        // Inside sigBlob:
        // sig_algo (string)
        // raw_signature (string)
        let sigOffset = 0;
        function readSigBlobUint32(): number {
            const val = sigBlob.readUint32BE(sigOffset);
            sigOffset += 4;
            return val;
        }
        function readSigBlobBuffer(): Buffer {
            const len = readSigBlobUint32();
            const buf = sigBlob.subarray(sigOffset, sigOffset + len);
            sigOffset += len;
            return buf;
        }

        const sigAlgo = readSigBlobBuffer().toString();
        if (sigAlgo !== 'ssh-ed25519') {
            throw new Error(`Unsupported signature algorithm: ${sigAlgo}`);
        }

        const rawSignature = readSigBlobBuffer();

        if (rawSignature.length !== 64) {
            throw new Error(`Expected 64-byte Ed25519 signature, got ${rawSignature.length} bytes`);
        }

        return {
            signature: Buffer.from(rawSignature),
            hashAlgorithm,
            namespace
        };
    } catch (err) {
        throw new Error(
            `Failed to parse SSH signature: ${err instanceof Error ? err.message : String(err)}`
        );
    }
}


export interface GitVerificationData {
    gitHandle: string;
    publicKey: Buffer;
    envelope: string;
    signature: Buffer;
    hashAlgorithm: string;
    namespace: string;
}

/**
 * Creates the binary blob to be verified according to OpenSSH SSHSIG protocol.
 */
async function createSSHSIGVerifyBlob(
    message: string,
    namespace: string,
    hashAlgorithm: string
): Promise<Uint8Array> {
    const magic = Buffer.from("SSHSIG");
    const reserved = Buffer.from("");

    // 1. Hash the original message
    let messageHash: Buffer;
    if (hashAlgorithm === "sha512") {
        const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(message));
        messageHash = Buffer.from(hashBuffer);
    } else if (hashAlgorithm === "sha256") {
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
        messageHash = Buffer.from(hashBuffer);
    } else {
        throw new Error(`Unsupported hash algorithm for wrapping: ${hashAlgorithm}`);
    }

    const writeString = (s: string | Buffer | Uint8Array): Uint8Array => {
        const content = typeof s === 'string' ? Buffer.from(s) : s;
        const len = Buffer.alloc(4);
        len.writeUInt32BE(content.length);
        return new Uint8Array(Buffer.concat([new Uint8Array(len), new Uint8Array(content)]));
    };

    return new Uint8Array(Buffer.concat([
        new Uint8Array(magic),
        writeString(namespace),
        writeString(reserved),
        writeString(hashAlgorithm),
        writeString(messageHash)
    ]));
}

export async function validateGitVerification(
    data: GitVerificationData,
    expectedNetworkPassphrase: string,
    expectedSigningAccount: string,
    expectedContractId: string
): Promise<{ valid: boolean; error?: string }> {
    try {
        const message = data.envelope.trim();
        const parsed = parseSEP53Envelope(message);
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

        // SSHSIG protocol requires verifying a wrapped blob
        const verifyBlob = await createSSHSIGVerifyBlob(
            message,
            data.namespace,
            data.hashAlgorithm
        );

        const signatureValid = await verifyEd25519Signature(
            new Uint8Array(data.publicKey),
            verifyBlob,
            new Uint8Array(data.signature)
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