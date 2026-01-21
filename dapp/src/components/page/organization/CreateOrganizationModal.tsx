import { useState, type FC, useCallback } from "react";
import { loadedPublicKey } from "@service/walletService";
import Button from "components/utils/Button.tsx";
import Input from "components/utils/Input.tsx";
import Label from "components/utils/Label.tsx";
import Textarea from "components/utils/Textarea.tsx";
import Title from "components/utils/Title.tsx";
import FlowProgressModal from "components/utils/FlowProgressModal.tsx";
import { uploadWithDelegation } from "@service/FlowService";
import {
  sendSignedTransaction,
  signAssembledTransaction,
} from "@service/TxService";
import { calculateDirectoryCid } from "utils/ipfsFunctions";
import { checkSimulationError } from "utils/contractErrors";
import Tansu from "../../../contracts/soroban_tansu";
import { toast } from "utils/utils";
import {
  validateProjectName as validateProjectNameUtil,
  validateMaintainerAddress,
} from "utils/validations.ts";

type ModalProps = {
  onClose: () => void;
};

const CreateOrganizationModal: FC<ModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [organizationName, setOrganizationName] = useState("");
  const [maintainerAddresses, setMaintainerAddresses] = useState<string[]>([
    loadedPublicKey() || "",
  ]);
  const [maintainerGithubs, setMaintainerGithubs] = useState<string[]>([""]);
  const [orgName, setOrgName] = useState("");
  const [orgUrl, setOrgUrl] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form validation errors
  const [organizationNameError, setOrganizationNameError] = useState<
    string | null
  >(null);
  const [maintainersErrors, setMaintainersErrors] = useState<
    Array<string | null>
  >([null]);
  const [orgNameError, setOrgNameError] = useState<string | null>(null);
  const [orgUrlError, setOrgUrlError] = useState<string | null>(null);
  const [orgLogoError, setOrgLogoError] = useState<string | null>(null);
  const [orgDescriptionError, setOrgDescriptionError] = useState<string | null>(
    null,
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate organization name
  const validateOrganizationName = useCallback((): boolean => {
    const error = validateProjectNameUtil(organizationName);
    setOrganizationNameError(error);
    return !error;
  }, [organizationName]);

  // Validate maintainers
  const validateMaintainers = useCallback((): boolean => {
    const errors = maintainerAddresses.map((addr) =>
      validateMaintainerAddress(addr),
    );
    setMaintainersErrors(errors);
    return errors.every((e) => !e);
  }, [maintainerAddresses]);

  // Validate org fields
  const validateOrgFields = useCallback((): boolean => {
    let isValid = true;

    if (!orgName.trim()) {
      setOrgNameError("Organization name is required");
      isValid = false;
    } else {
      setOrgNameError(null);
    }

    if (orgUrl && !orgUrl.startsWith("https://")) {
      setOrgUrlError("URL must start with https://");
      isValid = false;
    } else {
      setOrgUrlError(null);
    }

    if (orgLogo && !orgLogo.startsWith("https://")) {
      setOrgLogoError("Logo URL must start with https://");
      isValid = false;
    } else {
      setOrgLogoError(null);
    }

    if (!orgDescription.trim() || orgDescription.split(/\s+/).length < 3) {
      setOrgDescriptionError("Description must contain at least 3 words");
      isValid = false;
    } else {
      setOrgDescriptionError(null);
    }

    return isValid;
  }, [orgName, orgUrl, orgLogo, orgDescription]);

  const handleAddMaintainer = () => {
    setMaintainerAddresses([...maintainerAddresses, ""]);
    setMaintainerGithubs([...maintainerGithubs, ""]);
    setMaintainersErrors([...maintainersErrors, null]);
  };

  const handleRemoveMaintainer = (index: number) => {
    if (maintainerAddresses.length > 1) {
      setMaintainerAddresses(maintainerAddresses.filter((_, i) => i !== index));
      setMaintainerGithubs(maintainerGithubs.filter((_, i) => i !== index));
      setMaintainersErrors(maintainersErrors.filter((_, i) => i !== index));
    }
  };

  const handleMaintainerAddressChange = (index: number, value: string) => {
    const newAddresses = [...maintainerAddresses];
    newAddresses[index] = value;
    setMaintainerAddresses(newAddresses);
    if (maintainersErrors[index]) {
      const newErrors = [...maintainersErrors];
      newErrors[index] = validateMaintainerAddress(value);
      setMaintainersErrors(newErrors);
    }
  };

  const handleMaintainerGithubChange = (index: number, value: string) => {
    const newGithubs = [...maintainerGithubs];
    newGithubs[index] = value;
    setMaintainerGithubs(newGithubs);
  };

  const handleSubmit = async () => {
    if (
      !validateOrganizationName() ||
      !validateMaintainers() ||
      !validateOrgFields()
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create TOML file
      setStep(2);
      const tomlContent = `VERSION="2.0.0"

ACCOUNTS=[
${maintainerAddresses.map((a) => `    "${a}"`).join(",\n")}
]

[DOCUMENTATION]
ORG_NAME="${orgName}"
ORG_URL="${orgUrl}"
ORG_LOGO="${orgLogo}"
ORG_DESCRIPTION="${orgDescription}"

${maintainerGithubs
  .filter((gh) => gh.trim())
  .map((gh) => `[[PRINCIPALS]]\ngithub="${gh}"`)
  .join("\n\n")}
`;

      const tomlFile = new File([tomlContent], "tansu.toml", {
        type: "text/plain",
      });

      // Step 2: Calculate CID
      setStep(3);
      const expectedCid = await calculateDirectoryCid([tomlFile]);

      // Step 3: Create W3UP client for DID retrieval
      setStep(4);
      const { create } = await import("@storacha/client");
      const client = await create();
      const did = client.agent.did();

      // Step 4: Create & sign register transaction
      setStep(5);
      const publicKey = loadedPublicKey();
      if (!publicKey) throw new Error("Please connect your wallet first");

      Tansu.options.publicKey = publicKey;

      const tx = await (Tansu as any).register_organization({
        maintainer: publicKey,
        name: organizationName,
        maintainers: maintainerAddresses,
        ipfs: expectedCid,
      });

      checkSimulationError(tx as any);

      const signedTxXdr = await signAssembledTransaction(tx);

      // Step 5: Upload to IPFS with delegation
      setStep(6);
      setIsUploading(true);
      const cidUploaded = await uploadWithDelegation({
        files: [tomlFile],
        signedTxXdr,
        did,
      });

      // Step 6: Verify CID matches
      if (cidUploaded !== expectedCid) {
        throw new Error(
          `CID mismatch: expected ${expectedCid}, got ${cidUploaded}`,
        );
      }

      // Step 7: Send signed transaction
      setStep(7);
      await sendSignedTransaction(signedTxXdr);

      setIsSuccessful(true);
      toast.success(
        "Organization Created",
        `Organization "${organizationName}" has been successfully registered!`,
      );

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
      toast.error("Error", err.message || "Failed to create organization");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  console.log("CreateOrganizationModal rendering");

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          // Close modal when clicking on backdrop
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <Title
              title="Create Organization"
              description="Register a new organization to group multiple projects"
            />

            {step === 1 && (
              <div className="mt-6 space-y-6">
                {/* Organization Name */}
                <div>
                  <Label
                    htmlFor="organization-name"
                    label="Organization Name"
                    required
                  />
                  <Input
                    id="organization-name"
                    placeholder="my-org"
                    value={organizationName}
                    onChange={(e) => {
                      setOrganizationName(e.target.value);
                      setOrganizationNameError(null);
                    }}
                    error={organizationNameError}
                    maxLength={15}
                  />
                  <p className="text-xs text-secondary mt-1">
                    Max 15 characters. This will be used as the on-chain
                    identifier.
                  </p>
                </div>

                {/* Organization Details */}
                <div>
                  <Label
                    htmlFor="org-name"
                    label="Display Name"
                    description="Organization & repository"
                    required
                  />
                  <Input
                    id="org-name"
                    label="Organisation name"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgNameError(null);
                    }}
                    error={orgNameError}
                  />
                </div>

                <div>
                  <Label htmlFor="org-url" label="Organization Website URL" />
                  <Input
                    id="org-url"
                    label="Organisation URL"
                    value={orgUrl}
                    onChange={(e) => {
                      setOrgUrl(e.target.value);
                      setOrgUrlError(null);
                    }}
                    error={orgUrlError}
                  />
                </div>

                <div>
                  <Label htmlFor="org-logo" label="Organization Logo URL" />
                  <Input
                    id="org-logo"
                    label="Organisation Logo"
                    value={orgLogo}
                    onChange={(e) => {
                      setOrgLogo(e.target.value);
                      setOrgLogoError(null);
                    }}
                    error={orgLogoError}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="org-description"
                    label="Organization Description"
                    required
                  />
                  <Textarea
                    id="org-description"
                    value={orgDescription}
                    onChange={(e) => {
                      setOrgDescription(e.target.value);
                      setOrgDescriptionError(null);
                    }}
                    error={orgDescriptionError}
                    rows={4}
                  />
                </div>

                {/* Maintainers */}
                <div>
                  <Label
                    label="Maintainers"
                    description="Addresses that can manage this organization"
                    required
                  />
                  {maintainerAddresses.map((address, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="G..."
                            value={address}
                            onChange={(e) =>
                              handleMaintainerAddressChange(
                                index,
                                e.target.value,
                              )
                            }
                            error={maintainersErrors[index]}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="GitHub username (optional)"
                            value={maintainerGithubs[index]}
                            onChange={(e) =>
                              handleMaintainerGithubChange(
                                index,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        {maintainerAddresses.length > 1 && (
                          <Button
                            type="secondary"
                            onClick={() => handleRemoveMaintainer(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="secondary" onClick={handleAddMaintainer}>
                    Add Maintainer
                  </Button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-2 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button type="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    Create Organization
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(isUploading || isSuccessful) && (
        <FlowProgressModal
          currentStep={step}
          isUploading={isUploading}
          isSuccessful={isSuccessful}
          onClose={onClose}
        />
      )}
    </>
  );
};

export default CreateOrganizationModal;
