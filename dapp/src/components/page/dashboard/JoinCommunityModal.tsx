import { useState, type FC, useEffect } from "react";
import Input from "components/utils/Input";
import Button from "components/utils/Button";
import FlowProgressModal from "components/utils/FlowProgressModal";
import { loadedPublicKey } from "@service/walletService";
import { toast } from "utils/utils";
import { validateStellarAddress, validateUrl } from "utils/validations";
import SimpleMarkdownEditor from "components/utils/SimpleMarkdownEditor";
import { ed25519 } from "@noble/curves/ed25519";
import { Buffer } from "buffer";

interface ProfileImageFile {
  localUrl: string;
  source: File;
}

const JoinCommunityModal: FC<{
  onClose: () => void;
  onJoined?: () => void;
  prefillAddress?: string;
}> = ({ onClose, onJoined, prefillAddress = "" }) => {
  const [address, setAddress] = useState<string>(
    prefillAddress || loadedPublicKey() || "",
  );
  const [name, setName] = useState<string>("");
  const [social, setSocial] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [profileImage, setProfileImage] = useState<ProfileImageFile | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [updateSuccessful, setUpdateSuccessful] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Validation errors
  const [addressError, setAddressError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Git identity binding state
  const [linkGitHandle, setLinkGitHandle] = useState(false);
  const [gitHandle, setGitHandle] = useState("");
  const [gitPublicKey, setGitPublicKey] = useState("");
  const [gitSignature, setGitSignature] = useState("");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [gitHandleError, setGitHandleError] = useState<string | null>(null);
  const [gitPublicKeyError, setGitPublicKeyError] = useState<string | null>(
    null,
  );
  const [isGitPublicKeyVerified, setIsGitPublicKeyVerified] = useState(false);

  useEffect(() => {
    if (prefillAddress) {
      setAddress(prefillAddress);
    }
  }, [prefillAddress]);

  useEffect(() => {
    if (linkGitHandle && gitHandle && address) {
      const networkPassphrase =
        import.meta.env.PUBLIC_SOROBAN_NETWORK_PASSPHRASE;
      const contractId = import.meta.env.PUBLIC_TANSU_CONTRACT_ID;
      const nonce = window.crypto.getRandomValues(new Uint8Array(16));
      const nonceHex = Array.from(nonce)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const message = `Stellar Signed Message
${networkPassphrase}
${address}
${nonceHex}
tansu-bind|${contractId}|${gitHandle}`;
      setChallengeMessage(message);
    } else {
      setChallengeMessage("");
    }
  }, [linkGitHandle, gitHandle, address]);

  const fetchGitPublicKey = async () => {
    if (!gitHandle) {
      setGitHandleError("Git handle is required");
      return;
    }
    const parts = gitHandle.split(":");
    if (parts.length !== 2) {
      setGitHandleError("Invalid format. Use <provider>:<username>");
      return;
    }
    const [provider, username] = parts;
    if (provider !== "github") {
      setGitHandleError("Only github is supported for now.");
      return;
    }

    try {
      const response = await fetch(`https://github.com/${username}.keys`);
      if (response.ok) {
        const keys = await response.text();
        const ed25519Key = keys
          .split("\n")
          .find((key) => key.startsWith("ssh-ed25519"));
        if (ed25519Key) {
          const keyParts = ed25519Key.split(" ");
          setGitPublicKey(keyParts[1]);
        } else {
          setGitPublicKeyError("No Ed25519 key found on GitHub.");
        }
      } else {
        setGitPublicKeyError("Could not fetch keys from GitHub.");
      }
    } catch (e) {
      setGitPublicKeyError("Failed to fetch keys.");
    }
  };

  const verifySignature = () => {
    try {
      const pubKeyBytes = Buffer.from(gitPublicKey, "base64");
      const signatureBytes = Buffer.from(gitSignature, "base64");
      const messageBytes = Buffer.from(challengeMessage, "utf8");

      const verified = ed25519.verify(signatureBytes, messageBytes, pubKeyBytes);
      setIsGitPublicKeyVerified(verified);
      if (!verified) {
        toast.error("Error", "Signature verification failed.");
      } else {
        toast.success("Success", "Git public key verified.");
      }
    } catch (e) {
      toast.error("Error", "An error occurred during verification.");
      setIsGitPublicKeyVerified(false);
    }
  };

  const handleClose = () => {
    if (updateSuccessful) {
      window.location.reload();
    }
    setUpdateSuccessful(false);
    setStep(0);
    setIsLoading(false);
    setIsUploading(false);
    onClose?.();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setImageError("Please upload a PNG or JPG image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Please upload an image smaller than 5MB");
        return;
      }
      const url = URL.createObjectURL(file);
      setProfileImage({ localUrl: url, source: file });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImageError(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setImageError("Please upload a PNG or JPG image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Please upload an image smaller than 5MB");
        return;
      }
      const url = URL.createObjectURL(file);
      setProfileImage({ localUrl: url, source: file });
    }
  };

  const handleRemoveImage = () => {
    if (profileImage) {
      URL.revokeObjectURL(profileImage.localUrl);
      setProfileImage(null);
    }
  };

  const hasProfileData = () =>
    name.trim() || social.trim() || description.trim() || profileImage;

  const validateAddressField = (): boolean => {
    const error = validateStellarAddress(address);
    setAddressError(error);
    return error === null;
  };

  const validateSocialField = (): boolean => {
    const error = validateUrl(social);
    setSocialError(error);
    return error === null;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    if (!validateAddressField()) isValid = false;
    if (!validateSocialField()) isValid = false;
    if (linkGitHandle) {
      if (!gitHandle) {
        setGitHandleError("Git handle is required.");
        isValid = false;
      }
      if (!gitPublicKey) {
        setGitPublicKeyError("Public key is required.");
        isValid = false;
      }
      if (!isGitPublicKeyVerified) {
        toast.error("Error", "Git public key must be verified.");
        isValid = false;
      }
    }
    return isValid;
  };

  const handleJoin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setStep(6);
      const { joinCommunityFlow } = await import("@service/FlowService");
      let gitIdentityPayload = {};
      if (linkGitHandle && isGitPublicKeyVerified) {
        gitIdentityPayload = {
          git_identity: gitHandle,
          git_pubkey: Buffer.from(gitPublicKey, "base64"),
          msg: Buffer.from(challengeMessage, "utf8"),
          sig: Buffer.from(gitSignature, "base64"),
        };
      }

      if (!hasProfileData()) {
        await joinCommunityFlow({
          memberAddress: address,
          profileFiles: [],
          onProgress: setStep,
          ...gitIdentityPayload,
        });
      } else {
        const profileData = {
          name: name.trim(),
          description: description.trim(),
          social: social.trim(),
        };
        const profileBlob = new Blob([JSON.stringify(profileData)], {
          type: "application/json",
        });
        const files = [new File([profileBlob], "profile.json")];
        if (profileImage) {
          files.push(
            new File(
              [profileImage.source],
              "profile-image." + profileImage.source.type.split("/")[1],
            ),
          );
        }
        await joinCommunityFlow({
          memberAddress: address,
          profileFiles: files,
          onProgress: setStep,
          ...gitIdentityPayload,
        });
      }

      toast.success("Success", "You have successfully joined the community!");
      onJoined?.();
      setUpdateSuccessful(true);
      setIsLoading(false);
      setIsUploading(false);
      setStep(0);
    } catch (err: any) {
      console.error("Join community error:", err);
      setError(err.message || "Something went wrong");
      setStep(0);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <FlowProgressModal
      isOpen={true}
      onClose={handleClose}
      onSuccess={() => onJoined?.()}
      step={step}
      setStep={setStep}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isUploading={isUploading}
      setIsUploading={setIsUploading}
      isSuccessful={updateSuccessful}
      setIsSuccessful={setUpdateSuccessful}
      error={error}
      setError={setError}
      signLabel="membership"
      successTitle="Welcome aboard!"
      successMessage="You've successfully joined the community."
    >
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-[18px]">
        <img
          className="flex-none w-[200px] md:w-[360px]"
          src="/images/team.svg"
        />
        <div className="flex flex-col gap-4 md:gap-[30px] w-full">
          <h2 className="text-xl md:text-2xl font-bold text-primary">
            Join the Community
          </h2>

          <Input
            label="Member Address *"
            placeholder="Write the address as G..."
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setAddressError(null);
            }}
            error={addressError}
          />

          <div className="pt-2 md:pt-4">
            <p className="text-base font-medium text-primary mb-3 md:mb-4">
              Profile Information
            </p>

            <div className="flex flex-col gap-4 md:gap-[30px]">
              <Input
                label="Name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Social Profile Link"
                placeholder="https://twitter.com/yourhandle"
                value={social}
                onChange={(e) => {
                  setSocial(e.target.value);
                  setSocialError(null);
                }}
                error={socialError}
              />

              <div className="flex flex-col gap-[18px]">
                <p className="text-base font-[600] text-primary">
                  Profile Picture
                </p>
                {profileImage ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={profileImage.localUrl}
                      alt="Profile preview"
                      className="w-24 h-24 object-cover rounded-full border-2 border-primary"
                    />
                    <Button type="secondary" onClick={handleRemoveImage}>
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <label
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragLeave={() => setIsDragging(false)}
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 ${
                      imageError ? "border-red-500" : "border-dashed border-[#978AA1]"
                    } ${
                      isDragging ? "bg-zinc-500" : "bg-white"
                    } cursor-pointer bg-zinc-50 hover:bg-zinc-400`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className={`w-8 h-8 mb-4 ${
                          imageError ? "text-red-500" : "text-secondary"
                        }`}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-secondary">
                        <span className="font-semibold">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="text-xs text-secondary">
                        PNG or JPG (MAX. 5MB)
                      </p>
                      {imageError && (
                        <p className="mt-2 text-sm text-red-500">{imageError}</p>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-col gap-[18px]">
                <p className="text-base font-[600] text-primary">Description</p>
                <div className="rounded-md border border-zinc-400 overflow-hidden min-h-[150px]">
                  <SimpleMarkdownEditor
                    value={description}
                    onChange={(value) => setDescription(value)}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Git Identity Binding Section */}
              <div className="flex flex-col gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="link-git-handle"
                    checked={linkGitHandle}
                    onChange={(e) => setLinkGitHandle(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="link-git-handle"
                    className="text-base font-medium text-primary"
                  >
                    Link Git Handle (Optional)
                  </label>
                </div>

                {linkGitHandle && (
                  <div className="flex flex-col gap-4 pl-6 border-l-2 border-gray-200">
                    <Input
                      label="Git Handle"
                      placeholder="<provider>:<username> (e.g., github:alice)"
                      value={gitHandle}
                      onChange={(e) => {
                        setGitHandle(e.target.value);
                        setGitHandleError(null);
                      }}
                      error={gitHandleError}
                    />
                    <div className="flex items-end gap-2">
                      <Input
                        label="Ed25519 Public Key"
                        placeholder="Paste your public key or fetch it"
                        value={gitPublicKey}
                        onChange={(e) => {
                          setGitPublicKey(e.target.value);
                          setGitPublicKeyError(null);
                        }}
                        error={gitPublicKeyError}
                        containerClassName="grow"
                      />
                      <Button onClick={fetchGitPublicKey} type="secondary">
                        Fetch
                      </Button>
                    </div>

                    {challengeMessage && (
                      <>
                        <div className="flex flex-col gap-2">
                          <label className="text-base font-medium text-primary">
                            Challenge Message
                          </label>
                          <textarea
                            readOnly
                            value={challengeMessage}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                            rows={6}
                          />
                          <p className="text-xs text-gray-500">
                            Run the following command in your terminal to sign this
                            message with your SSH key:
                          </p>
                          <code className="text-xs bg-gray-100 p-2 rounded-md overflow-x-auto">
                            ssh-keygen -Y sign -f ~/.ssh/id_ed25519 -n
                            file &lt;(echo -n "{challengeMessage}")
                          </code>
                        </div>
                        <Input
                          label="Signature"
                          placeholder="Paste the signature here"
                          value={gitSignature}
                          onChange={(e) => setGitSignature(e.target.value)}
                        />
                        <Button onClick={verifySignature} type="secondary" disabled={isGitPublicKeyVerified}>
                          {isGitPublicKeyVerified ? "Verified" : "Verify"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              isLoading={isLoading || isUploading}
              onClick={handleJoin}
            >
              Join
            </Button>
          </div>
        </div>
      </div>
    </FlowProgressModal>
  );
};

export default JoinCommunityModal;
