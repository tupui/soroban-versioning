import { useState, type FC } from "react";
import Input from "./Input";
import Button from "./Button";
import {
  parseGitHandle,
  fetchGitPublicKeys,
  extractEd25519PublicKey,
  createSEP53Envelope,
  generateSSHSignCommand,
  parseSSHSignature,
  validateGitVerification,
  type GitVerificationData,
} from "../../utils/gitVerification";
import CopyButton from "./CopyButton";
import { toast } from "utils/utils";

interface GitVerificationProps {
  onShowGitVerification: (show: boolean) => void;
  onVerificationComplete: (data: GitVerificationData | null) => void;
  networkPassphrase: string;
  signingAccount: string;
  contractId: string;
  setError: (err: string) => void;
}

const GitVerification: FC<GitVerificationProps> = ({
  onShowGitVerification,
  onVerificationComplete,
  networkPassphrase,
  signingAccount,
  contractId,
  setError,
}) => {
  const [wantGitLink, setWantGitLink] = useState<boolean | null>(null);
  const [gitHandle, setGitHandle] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [envelope, setEnvelope] = useState("");
  const [signature, setSignature] = useState("");
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [step, setStep] = useState<
    "choice" | "handle" | "key" | "sign" | "verify"
  >("choice");

  const handleGitHandleSubmit = async () => {
    if (!gitHandle.trim()) {
      setError("Please enter a Git handle");
      return;
    }

    const parsed = parseGitHandle(gitHandle.trim());
    if (!parsed) {
      setError(
        "Invalid Git handle format. Use provider:username (e.g., github:alice)",
      );
      return;
    }

    setIsLoadingKeys(true);
    try {
      const keys = await fetchGitPublicKeys(gitHandle.trim());
      setAvailableKeys(keys);
      setStep("key");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch Git keys",
      );
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleKeySelection = () => {
    if (!selectedKey) {
      setError("Please select a public key");
      return;
    }

    // if (!contractId) {
    //   toast.error("Error", "Contract ID is not available. Please try again later.");
    //   return;
    // }

    const generatedEnvelope = createSEP53Envelope(
      networkPassphrase,
      signingAccount,
      contractId,
      gitHandle.trim(),
    );
    setEnvelope(generatedEnvelope);
    setStep("sign");
  };

  const handleVerifySignature = async () => {
    if (!signature.trim()) {
      setVerificationError("Please paste your signature");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      const publicKey = extractEd25519PublicKey(selectedKey);
      const {
        signature: parsedSignature,
        hashAlgorithm,
        namespace,
      } = parseSSHSignature(signature.trim());

      const verificationData: GitVerificationData = {
        gitHandle: gitHandle.trim(),
        publicKey,
        envelope,
        signature: parsedSignature,
        hashAlgorithm,
        namespace,
      };

      const validation = await validateGitVerification(
        verificationData,
        networkPassphrase,
        signingAccount,
        contractId,
      );

      console.log("Git verification result:", validation);

      if (validation.valid) {
        toast.success("Success", "Git verification completed successfully!");
        setIsVerified(true);
        onVerificationComplete(verificationData);
      } else {
        setVerificationError(validation.error || "Unknown error");
      }
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSkip = () => {
    setWantGitLink(false);
    onShowGitVerification(false);
    onVerificationComplete(null);
  };

  if (wantGitLink === false) {
    return null;
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-lg font-semibold text-primary mb-4">
        Git Handle Verification
      </h3>

      {step === "choice" && (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Would you like to link a Git handle to your account for
            verification?
          </p>
          <div className="flex gap-3">
            <Button
              type="primary"
              onClick={() => {
                setWantGitLink(true);
                setStep("handle");
                onShowGitVerification(true);
              }}
            >
              Yes, Link Git Handle
            </Button>
            <Button type="secondary" onClick={handleSkip}>
              Skip
            </Button>
          </div>
        </div>
      )}

      {step === "handle" && (
        <div className="space-y-4">
          <Input
            label="Git Handle"
            placeholder="github:alice or gitlab:bob"
            value={gitHandle}
            onChange={(e) => setGitHandle(e.target.value)}
            helpText="Format: provider:username (supports GitHub and GitLab)"
          />
          <div className="flex gap-3">
            <Button
              type="primary"
              onClick={handleGitHandleSubmit}
              isLoading={isLoadingKeys}
            >
              Fetch Public Keys
            </Button>
            <Button type="secondary" onClick={() => setStep("choice")}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === "key" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Select Ed25519 Public Key
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableKeys.map((key, index) => (
                <label
                  key={index}
                  className="flex items-start gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="publicKey"
                    value={key}
                    checked={selectedKey === key}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-xs font-mono break-all">{key}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="primary" onClick={handleKeySelection}>
              Continue
            </Button>
            <Button type="secondary" onClick={() => setStep("handle")}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === "sign" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              SEP-53 Envelope to Sign
            </label>
            <textarea
              value={envelope}
              readOnly
              className="w-full p-3 border rounded font-mono text-xs bg-gray-50"
              rows={6}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium text-blue-900 mb-2">
              Sign this envelope with your Git key:
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm text-blue-800 mb-1">SSH Command:</p>
                  <code className="block p-2 bg-blue-100 rounded text-xs break-all">
                    {generateSSHSignCommand(envelope).replace(
                      /\s*\/dev\/stdin\s*/g,
                      "",
                    )}
                  </code>
                </div>
                <CopyButton
                  textToCopy={generateSSHSignCommand(envelope).replace(
                    /\s*\/dev\/stdin\s*/g,
                    "",
                  )}
                  size="sm"
                />
              </div>
              {/* Only show GPG command if not using SSH key (future extensibility) */}
              {/*
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm text-blue-800 mb-1">GPG Command:</p>
                  <code className="block p-2 bg-blue-100 rounded text-xs break-all">
                    {generateGPGSignCommand(envelope)}
                  </code>
                </div>
                <CopyButton textToCopy={generateGPGSignCommand(envelope)} size="sm" />
              </div>
              */}
            </div>
          </div>

          <Input
            label="Paste Signature"
            placeholder="Paste the signature output here..."
            value={signature}
            onChange={(e) => {
              setSignature(e.target.value);
              if (verificationError) setVerificationError(null);
            }}
            multiline
            rows={6}
            disabled={isVerified}
          />

          {verificationError && (
            <p className="text-sm text-red-500 mt-2">{verificationError}</p>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              type="primary"
              onClick={handleVerifySignature}
              isLoading={isVerifying}
              disabled={isVerified}
            >
              {isVerified ? "Verified ✓" : "Verify Signature"}
            </Button>
            {!isVerified && (
              <Button type="secondary" onClick={() => setStep("key")}>
                Back
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitVerification;
