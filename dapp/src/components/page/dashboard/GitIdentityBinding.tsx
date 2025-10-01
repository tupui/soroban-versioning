import { useState, useEffect } from "react";
import Input from "components/utils/Input";
import Button from "components/utils/Button";
import Spinner from "components/utils/Spinner";
import { loadedPublicKey } from "@service/walletService";
import * as ed25519 from "noble-ed25519";

interface GitKey {
  id: number;
  key: string;
  key_type: string;
  raw_key?: string;
  title?: string;
}

interface GitIdentityBindingProps {
  onGitDataChange: (data: GitBindingData | null) => void;
  disabled?: boolean;
}

export interface GitBindingData {
  gitIdentity: string;
  gitPubkey: Uint8Array;
  message: Uint8Array;
  signature: Uint8Array;
}

const GitIdentityBinding: React.FC<GitIdentityBindingProps> = ({ 
  onGitDataChange, 
  disabled = false 
}) => {
  const [showGitBinding, setShowGitBinding] = useState(false);
  const [provider, setProvider] = useState<"github" | "gitlab">("github");
  const [username, setUsername] = useState("");
  const [keys, setKeys] = useState<GitKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<GitKey | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [envelope, setEnvelope] = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  // Generate SEP-53 envelope when git identity or selected key changes
  useEffect(() => {
    if (username && selectedKey) {
      generateEnvelope();
    }
  }, [username, provider, selectedKey]);

  // Reset validation when signature changes
  useEffect(() => {
    setIsValidated(false);
  }, [signature]);

  const fetchGitKeys = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsLoadingKeys(true);
    setError(null);
    setKeys([]);
    setSelectedKey(null);

    try {
      const apiUrl = provider === "github" 
        ? `https://api.github.com/users/${username}/keys`
        : `https://gitlab.com/api/v4/users/${username}/keys`;

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User '${username}' not found on ${provider}`);
        }
        throw new Error(`Failed to fetch keys: ${response.statusText}`);
      }

      const fetchedKeys = await response.json();
      
      if (!Array.isArray(fetchedKeys) || fetchedKeys.length === 0) {
        throw new Error(`No public keys found for ${username} on ${provider}`);
      }

      // Filter for Ed25519 keys
      const ed25519Keys = fetchedKeys.filter(key => 
        key.key && key.key.startsWith('ssh-ed25519')
      );

      if (ed25519Keys.length === 0) {
        throw new Error(`No Ed25519 keys found for ${username}. Please add an Ed25519 key to your ${provider} account.`);
      }

      setKeys(ed25519Keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch keys");
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const generateEnvelope = () => {
    if (!username || !selectedKey) return;

    // Generate random 16-byte nonce
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Get current network passphrase from environment
    const networkPassphrase = import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
    
    // Get current user's stellar address from wallet
    const stellarAddress = loadedPublicKey();
    if (!stellarAddress) {
      setError("Please connect your wallet first");
      return;
    }

    // Get contract ID from environment
    const contractId = import.meta.env.PUBLIC_TANSU_CONTRACT_ID;
    if (!contractId) {
      setError("Contract ID not configured");
      return;
    }

    const gitIdentity = `${provider}:${username}`;

    const envelope = [
      "Stellar Signed Message",
      networkPassphrase,
      stellarAddress,
      nonce,
      `tansu-bind|${contractId}|${gitIdentity}`
    ].join('\n');

    setEnvelope(envelope);
  };

  const generateSigningCommands = () => {
    if (!envelope || !selectedKey) return null;

    return {
      ssh: `printf "%s" "${envelope}" | ssh-keygen -Y sign -f ~/.ssh/id_ed25519 -n file`,
      gpg: `printf "%s" "${envelope}" | gpg --clear-sign --detach-sig --armor`
    };
  };

  const parseSignature = (sigText: string): Uint8Array | null => {
    try {
      const trimmed = sigText.trim();
      
      // Handle SSH signature format
      if (trimmed.startsWith('-----BEGIN SSH SIGNATURE-----')) {
        // Basic SSHSIG parsing - extract the base64 content
        const lines = trimmed.split('\n');
        const base64Lines = lines.slice(1, -1).filter(line => !line.includes('-----'));
        const base64Content = base64Lines.join('');
        
        try {
          const decoded = atob(base64Content);
          // For MVP, we'll assume the user provides the raw 64-byte signature
          // In production, this would properly parse the SSH signature format
          if (decoded.length >= 64) {
            const rawSig = decoded.slice(-64);
            return new Uint8Array(Array.from(rawSig).map(c => c.charCodeAt(0)));
          }
        } catch {
          // Fall through to try raw base64
        }
      }
      
      // Handle raw base64-encoded signature (64 bytes for Ed25519)
      if (trimmed.length === 88) { // 64 bytes * 4/3 base64 encoding
        const decoded = atob(trimmed);
        if (decoded.length === 64) {
          return new Uint8Array(Array.from(decoded).map(c => c.charCodeAt(0)));
        }
      }
      
      // Fallback: try to decode as base64
      const decoded = atob(trimmed);
      return new Uint8Array(Array.from(decoded).map(c => c.charCodeAt(0)));
    } catch {
      return null;
    }
  };

  const parsePublicKey = (keyString: string): Uint8Array | null => {
    try {
      // Parse SSH Ed25519 public key format: "ssh-ed25519 <base64-key> [comment]"
      const parts = keyString.trim().split(' ');
      if (parts.length >= 2 && parts[0] === 'ssh-ed25519' && parts[1]) {
        const keyData = atob(parts[1]);
        
        // SSH key format: [length][type][length][key-data]
        // For ssh-ed25519, we need to skip the SSH wire format headers
        // The actual Ed25519 public key is the last 32 bytes
        if (keyData.length >= 32) {
          const rawKey = keyData.slice(-32);
          return new Uint8Array(Array.from(rawKey).map(c => c.charCodeAt(0)));
        }
      }
      return null;
    } catch {
      return null;
    }
  };

    const validateAndSubmit = async () => {
    if (!username || !selectedKey || !envelope || !signature) {
      setError("Please complete all fields");
      return;
    }

    // Validate envelope structure
    const envelopeLines = envelope.split('\n');
    if (envelopeLines.length !== 5) {
      setError("Invalid envelope: must have exactly 5 lines");
      return;
    }

    if (envelopeLines[0] !== "Stellar Signed Message") {
      setError("Invalid envelope: missing proper SEP-53 header");
      return;
    }

    const expectedGitIdentity = `${provider}:${username}`;
    const payloadLine = envelopeLines[4];
    if (!payloadLine || !payloadLine.includes(expectedGitIdentity)) {
      setError(`Invalid envelope: missing git identity ${expectedGitIdentity}`);
      return;
    }

    const parsedSignature = parseSignature(signature);
    const parsedPubkey = parsePublicKey(selectedKey.key);

    if (!parsedSignature) {
      setError("Invalid signature format. Please provide a valid Ed25519 signature.");
      return;
    }

    if (parsedSignature.length !== 64) {
      setError("Invalid signature: Ed25519 signatures must be exactly 64 bytes");
      return;
    }

    if (!parsedPubkey) {
      setError("Invalid public key format. Please ensure you've selected a valid Ed25519 key.");
      return;
    }

    if (parsedPubkey.length !== 32) {
      setError("Invalid public key: Ed25519 keys must be exactly 32 bytes");
      return;
    }

    // Verify the signature before proceeding
    try {
      const messageBytes = new TextEncoder().encode(envelope);
      const isValid = await ed25519.verify(parsedSignature, messageBytes, parsedPubkey);
      
      if (!isValid) {
        setError("Invalid signature: signature verification failed. Please ensure you signed the exact envelope text.");
        return;
      }
    } catch (err) {
      setError("Signature verification error: " + (err instanceof Error ? err.message : "Unknown error"));
      return;
    }

    const gitBindingData: GitBindingData = {
      gitIdentity: expectedGitIdentity,
      gitPubkey: parsedPubkey,
      message: new TextEncoder().encode(envelope),
      signature: parsedSignature,
    };

    setIsValidated(true);
    onGitDataChange(gitBindingData);
    setError(null);
  };

  const resetBinding = () => {
    setShowGitBinding(false);
    setUsername("");
    setKeys([]);
    setSelectedKey(null);
    setEnvelope("");
    setSignature("");
    setError(null);
    setIsValidated(false);
    onGitDataChange(null);
  };

  if (!showGitBinding) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Git Identity (Optional)</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowGitBinding(true)}
            disabled={disabled}
          >
            Link Git Handle
          </Button>
        </div>
        <p className="text-sm text-secondary">
          Link your GitHub or GitLab account to prove ownership and build reputation.
        </p>
      </div>
    );
  }

  const commands = generateSigningCommands();

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Link Git Identity</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetBinding}
          disabled={disabled}
        >
          Cancel
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as "github" | "gitlab")}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={disabled}
          >
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
          </select>
        </div>

        <div>
          <Input
            label="Username"
            placeholder={`Your ${provider} username`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={fetchGitKeys}
        disabled={!username.trim() || isLoadingKeys || disabled}
        className="w-full"
      >
        {isLoadingKeys ? <Spinner /> : `Fetch ${provider} Keys`}
      </Button>

      {keys.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Ed25519 Public Key
          </label>
          <select
            value={selectedKey?.id || ""}
            onChange={(e) => {
              const key = keys.find(k => k.id === parseInt(e.target.value));
              setSelectedKey(key || null);
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={disabled}
          >
            <option value="">Select a key...</option>
            {keys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.title || `Key ${key.id}`} - {key.key.substring(0, 50)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {envelope && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message to Sign (SEP-53 Envelope)
          </label>
          <div className="mb-2 text-xs text-gray-600">
            Network: {import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015"}
          </div>
          <textarea
            value={envelope}
            readOnly
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
            rows={5}
          />
          <div className="mt-1 text-xs text-gray-500">
            This envelope follows the SEP-53 standard for Stellar message signing.
          </div>
        </div>
      )}

      {commands && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signing Commands
          </label>
          <div className="space-y-2">
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">SSH (OpenSSH):</div>
              <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                {commands.ssh}
              </code>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">GPG:</div>
              <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                {commands.gpg}
              </code>
            </div>
          </div>
        </div>
      )}

      <div>
        <Input
          label="Paste Signature"
          placeholder="Paste the signature output here..."
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />
        {isValidated && (
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Signature verified successfully
          </div>
        )}
      </div>

      <Button
        onClick={validateAndSubmit}
        disabled={!signature.trim() || disabled}
        className="w-full"
      >
        {isValidated ? 'Git Identity Linked ✓' : 'Verify & Link Git Identity'}
      </Button>
    </div>
  );
};

export default GitIdentityBinding;