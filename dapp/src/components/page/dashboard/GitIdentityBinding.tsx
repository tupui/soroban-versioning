import { useState, useEffect } from "react";
import Input from "components/utils/Input";
import Button from "components/utils/Button";
import Spinner from "components/utils/Spinner";

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

  // Generate SEP-53 envelope when git identity or selected key changes
  useEffect(() => {
    if (username && selectedKey) {
      generateEnvelope();
    }
  }, [username, provider, selectedKey]);

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

    // Get current network passphrase (would need to be determined from environment)
    const networkPassphrase = "Test SDF Network ; September 2015"; // or "Public Global Stellar Network ; September 2015"
    
    // Get current user's stellar address (would need to be passed in)
    const stellarAddress = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // placeholder

    // Generate contract ID (would need to be from environment)
    const contractId = "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // placeholder

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
      // For now, assume the user provides a base64-encoded raw signature
      // In production, this would parse SSH or GPG signature formats
      const decoded = atob(sigText.trim());
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
        // SSH Ed25519 public key format has some headers, extract the raw 32-byte key
        // This is a simplified extraction - production would need proper SSH key parsing
        const rawKey = keyData.slice(-32);
        return new Uint8Array(Array.from(rawKey).map(c => c.charCodeAt(0)));
      }
      return null;
    } catch {
      return null;
    }
  };

  const validateAndSubmit = () => {
    if (!username || !selectedKey || !envelope || !signature) {
      setError("Please complete all fields");
      return;
    }

    const parsedSignature = parseSignature(signature);
    const parsedPubkey = parsePublicKey(selectedKey.key);

    if (!parsedSignature) {
      setError("Invalid signature format");
      return;
    }

    if (!parsedPubkey) {
      setError("Invalid public key format");
      return;
    }

    const gitBindingData: GitBindingData = {
      gitIdentity: `${provider}:${username}`,
      gitPubkey: parsedPubkey,
      message: new TextEncoder().encode(envelope),
      signature: parsedSignature,
    };

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
            Message to Sign
          </label>
          <textarea
            value={envelope}
            readOnly
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
            rows={5}
          />
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
      </div>

      <Button
        onClick={validateAndSubmit}
        disabled={!signature.trim() || disabled}
        className="w-full"
      >
        Verify & Link Git Identity
      </Button>
    </div>
  );
};

export default GitIdentityBinding;