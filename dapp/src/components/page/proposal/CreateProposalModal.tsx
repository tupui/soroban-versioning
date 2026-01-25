import { getProjectFromName } from "@service/ReadContractService";
import Button from "components/utils/Button";
import { DatePicker } from "components/utils/DatePicker";
import { ExpandableText } from "components/utils/ExpandableText";
import Input from "components/utils/Input";
import Label from "components/utils/Label";
import FlowProgressModal from "components/utils/FlowProgressModal";
import Step from "components/utils/Step";
import Title from "components/utils/Title";
import { useCallback, useEffect, useState } from "react";
import type { ProposalOutcome, OutcomeContract } from "types/proposal";
import { formatDate } from "utils/formatTimeFunctions";
import { connectedPublicKey } from "utils/store";
import { capitalizeFirstLetter, toast } from "utils/utils";
import { getIpfsBasicLink } from "utils/ipfsFunctions";
import { validateProposalName, validateTextContent } from "utils/validations";
import OutcomeInput from "./OutcomeInput";
import { generateRSAKeyPair } from "utils/crypto";
import { setupAnonymousVoting } from "@service/ContractService";
import SimpleMarkdownEditor from "components/utils/SimpleMarkdownEditor";
import { navigate } from "astro:transitions/client";
import Loading from "components/utils/Loading";

const CreateProposalModal = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [maintainers, setMaintainers] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [proposalName, setProposalName] = useState("");
  const [mdText, setMdText] = useState("");

  // Local image handling for Markdown content
  type ProposalImage = { localUrl: string; publicUrl: string; source: File };
  const [imageFiles, setImageFiles] = useState<ProposalImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const [approveDescription, setApproveDescription] = useState("");
  const [rejectDescription, setRejectDescription] = useState("");
  const [cancelledDescription, setCancelledDescription] = useState("");

  // XDR mode state (existing)
  const [approveXdr, setApproveXdr] = useState<string | null>("");
  const [rejectXdr, setRejectXdr] = useState<string | null>(null);
  const [cancelledXdr, setCancelledXdr] = useState<string | null>(null);

  // Contract mode state (new)
  // Outcome visibility state - default to hidden
  const [showApproveOutcome, setShowApproveOutcome] = useState(false);
  const [showRejectOutcome, setShowRejectOutcome] = useState(false);
  const [showCancelledOutcome, setShowCancelledOutcome] = useState(false);

  const [approveContract, setApproveContract] =
    useState<OutcomeContract | null>({ address: "", execute_fn: "", args: [] });
  const [rejectContract, setRejectContract] = useState<OutcomeContract | null>({
    address: "",
    execute_fn: "",
    args: [],
  });
  const [cancelledContract, setCancelledContract] =
    useState<OutcomeContract | null>({ address: "", execute_fn: "", args: [] });

  // Mode selection state (new)
  const [approveMode, setApproveMode] = useState<
    "xdr" | "contract" | "none"
  >("contract"); // Default to contract
  const [rejectMode, setRejectMode] = useState<"xdr" | "contract" | "none">(
    "contract",
  );
  const [cancelledMode, setCancelledMode] = useState<
    "xdr" | "contract" | "none"
  >("contract");
  // Default to 2 days in the future to comfortably exceed the 24h minimum
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  });
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [_ipfsLink, setIpfsLink] = useState("");
  const [isAnonymousVoting, setIsAnonymousVoting] = useState(false);
  const [preparedFiles, setPreparedFiles] = useState<File[] | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<{
    publicKey: string;
    privateKey: string;
  } | null>(null);
  const [existingAnonConfig, setExistingAnonConfig] = useState<boolean>(false);
  const [resetAnonKeys, setResetAnonKeys] = useState<boolean>(false);
  const [keysDownloaded, setKeysDownloaded] = useState<boolean>(false);
  const [proposalNameError, setProposalNameError] = useState<string | null>(
    null,
  );
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [approveDescriptionError, setApproveDescriptionError] = useState<
    string | null
  >(null);
  const [approveXdrError, setApproveXdrError] = useState<string | null>(null);
  const [approveContractError, setApproveContractError] = useState<
    string | null
  >(null);

  // Initialize contract objects when switching to contract mode
  useEffect(() => {
    if (approveMode === "contract" && !approveContract) {
      setApproveContract({ address: "", execute_fn: "", args: [] });
    }
  }, [approveMode, approveContract]);

  useEffect(() => {
    if (rejectMode === "contract" && !rejectContract) {
      setRejectContract({ address: "", execute_fn: "", args: [] });
    }
  }, [rejectMode, rejectContract]);

  useEffect(() => {
    if (cancelledMode === "contract" && !cancelledContract) {
      setCancelledContract({ address: "", execute_fn: "", args: [] });
    }
  }, [cancelledMode, cancelledContract]);

  // Flow state management
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubmitAvailability = () => {
    if (!connectedAddress) throw new Error("Please connect your wallet first");
    if (!projectName) throw new Error("Project name is not provided");
    if (!maintainers.includes(connectedAddress))
      throw new Error("Only maintainers can submit proposals");
  };

  const handleSubmmitProposal = useCallback(() => {
    try {
      checkSubmitAvailability();
      setShowModal(true);
    } catch (err: any) {
      toast.error("Submit proposal", err.message);
    }
  }, [connectedAddress, projectName, maintainers]);

  useEffect(() => {
    const unsubscribe = connectedPublicKey.subscribe((publicKey) =>
      setConnectedAddress(publicKey),
    );
    const name = new URLSearchParams(window.location.search).get("name");
    setProjectName(name);
    const showModalButton = document.querySelector("#create-proposal-button");

    // pre-existing flag check
    if ((window as any).__nextFunc === "create_proposal") {
      setShowModal(true);
      setStep(1);
    }

    if (showModalButton) {
      setStep(1);
      showModalButton.addEventListener("click", handleSubmmitProposal);
      return () => {
        unsubscribe();
        showModalButton.removeEventListener("click", handleSubmmitProposal);
      };
    }

    return () => {
      unsubscribe();
    };
  }, [handleSubmmitProposal]);

  useEffect(() => {
    if (projectName) {
      (async () => {
        try {
          const projectInfo = await getProjectFromName(projectName);
          if (projectInfo?.maintainers) {
            setMaintainers(projectInfo.maintainers);
          }
        } catch (error) {
          console.error("Error fetching project info:", error);
        }
      })();
    }
  }, [projectName]);

  const prepareProposalFiles = (): File[] => {
    // Helper to build an outcome block with optional xdr/contract data
    const buildOutcome = (
      description: string,
      mode: "xdr" | "contract" | "none",
      xdrValue: string | null | undefined,
      contract: OutcomeContract | null,
    ): ProposalOutcome[keyof ProposalOutcome] | undefined => {
      if (!description.trim() && mode === "none") return undefined;

      const outcome: ProposalOutcome[keyof ProposalOutcome] = {
        description: description.trim(),
      };

      if (mode === "xdr" && xdrValue) {
        outcome.xdr = xdrValue;
      }

      if (mode === "contract" && contract?.address?.trim()) {
        outcome.contract = contract;
      }

      return outcome;
    };

    // Always prepare outcomes.json with descriptions for all outcome types
    const proposalOutcome: ProposalOutcome = {};

    const approvedOutcome = buildOutcome(
      approveDescription,
      approveMode,
      approveXdr,
      approveContract,
    );
    const rejectedOutcome = buildOutcome(
      rejectDescription,
      rejectMode,
      rejectXdr,
      rejectContract,
    );
    const cancelledOutcome = buildOutcome(
      cancelledDescription,
      cancelledMode,
      cancelledXdr,
      cancelledContract,
    );

    if (approvedOutcome) proposalOutcome.approved = approvedOutcome;
    if (rejectedOutcome) proposalOutcome.rejected = rejectedOutcome;
    if (cancelledOutcome) proposalOutcome.cancelled = cancelledOutcome;

    const outcomeBlob = new Blob([JSON.stringify(proposalOutcome)], {
      type: "application/json",
    });

    let files: File[] = [new File([outcomeBlob], "outcomes.json")];
    let description = mdText;

    // Handle images for the description
    imageFiles.forEach((image) => {
      if (description.includes(image.localUrl)) {
        description = description.replace(
          new RegExp(image.localUrl, "g"),
          image.publicUrl,
        );
        files.push(new File([image.source], image.publicUrl));
      }
    });

    files.push(new File([description], "proposal.md"));
    return files;
  };

  // Helper function to get parameter name by index for a given function
  const getParamName = (functionName: string, paramIndex: number): string => {
    // This is a simplified mapping - in a real implementation you'd get this
    // from the contract introspection service based on the function signature
    const paramMappings: Record<string, string[]> = {
      mint: ["message", "signature", "recovery_id", "public_key", "nonce"],
      transfer: [
        "from",
        "to",
        "token_id",
        "message",
        "signature",
        "recovery_id",
        "public_key",
        "nonce",
      ],
      balance: ["owner"],
      owner_of: ["token_id"],
      get_nonce: ["public_key"],
      name: [],
      symbol: [],
      token_uri: ["token_id"],
      token_id: ["public_key"],
      public_key: ["token_id"],
    };

    const params = paramMappings[functionName] || [];
    return params[paramIndex] || `arg${paramIndex}`;
  };

  // Helper function to format contract values for display
  const formatContractValue = (arg: any): string => {
    if (arg === null || arg === undefined) return "null";

    // Handle different JavaScript value types
    switch (typeof arg) {
      case "string":
        return `"${arg}"`;
      case "number":
        return arg.toString();
      case "boolean":
        return arg ? "true" : "false";
      case "object":
        return JSON.stringify(arg);
      default:
        return String(arg);
    }
  };

  const startProposalCreation = async (files: File[]) => {
    try {
      setIsLoading(true);
      // Step progression handled by FlowService onProgress: 7-sign, 8-upload, 9-send
      setStep(6);

      // Validate outcomes before submission - only if outcomes are configured
      const hasAnyOutcome =
        showApproveOutcome || showRejectOutcome || showCancelledOutcome;
      if (hasAnyOutcome && !validateApproveOutcome(true)) {
        throw new Error("Invalid approved outcome configuration");
      }

      // 2️⃣  Calculate voting end timestamp & build proposal transaction
      // Ensure at least 25h window between now and voting end
      let targetTs = selectedDate.getTime();

      // Validate that we have a valid timestamp
      if (isNaN(targetTs) || targetTs <= 0 || !isFinite(targetTs)) {
        throw new Error(`Invalid voting end date: ${selectedDate}`);
      }

      const min25hMs = Date.now() + 25 * 60 * 60 * 1000;
      if (targetTs < min25hMs) {
        targetTs = min25hMs;
      }

      // Cap to 30 days max by using existing validation but double-check here as well
      const max30dMs = Date.now() + 30 * 24 * 60 * 60 * 1000;
      if (targetTs > max30dMs) {
        targetTs = max30dMs;
      }

      const votingEndsAt = Math.floor(targetTs / 1000);

      // Prepare contract outcomes array [approved, rejected, cancelled]
      // Contract execution data stays onchain; outcomes must be provided in order without gaps.
      const rawContractOutcomes: (OutcomeContract | null)[] = [
        approveMode === "contract" && approveContract?.address?.trim()
          ? approveContract
          : null,
        rejectMode === "contract" && rejectContract?.address?.trim()
          ? rejectContract
          : null,
        cancelledMode === "contract" && cancelledContract?.address?.trim()
          ? cancelledContract
          : null,
      ];

      // Prevent submitting reject/cancel contracts without an approve contract first.
      const hasGap = rawContractOutcomes.some(
        (entry, idx) =>
          !entry && rawContractOutcomes.slice(idx + 1).some(Boolean),
      );
      if (hasGap) {
        throw new Error(
          "Add contract outcomes in order (approve, then reject, then cancel) without skipping earlier steps.",
        );
      }

      const contractOutcomes = rawContractOutcomes.filter(
        (oc): oc is OutcomeContract =>
          !!oc && !!oc.address && oc.address.trim() !== "",
      );

      const { createProposalFlow } = await import("@service/FlowService");

      console.log("🔍 DEBUG: createProposalFlow parameters:");
      console.log("projectName:", projectName);
      console.log("proposalName:", proposalName);
      console.log("files:", files);
      console.log("votingEndsAt:", votingEndsAt, typeof votingEndsAt);
      console.log("publicVoting:", !isAnonymousVoting ? true : false);
      console.log(
        "outcomeContracts:",
        JSON.stringify(contractOutcomes, null, 2),
      );
      console.log(
        "contractOutcomes types:",
        contractOutcomes.map((oc) => typeof oc),
      );

      const proposalId = await createProposalFlow({
        projectName: projectName!,
        proposalName,
        proposalFiles: files,
        votingEndsAt: votingEndsAt,
        publicVoting: !isAnonymousVoting ? true : false,
        outcomeContracts: contractOutcomes,
        onProgress: setStep,
      });

      setProposalId(proposalId);

      // 3️⃣  Compute IPFS link for UI reference
      const { calculateDirectoryCid } = await import("utils/ipfsFunctions");
      const cid = await calculateDirectoryCid(files);
      setIpfsLink(getIpfsBasicLink(cid));

      // Success
      setIsSuccessful(true);
      setStep(0);
    } catch (err: any) {
      console.error(err.message);
      setError(err.message);
      setStep(0);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleRegisterProposal = async () => {
    try {
      checkSubmitAvailability();

      // Prepare files once and reuse across steps to ensure consistent CID
      const files = prepareProposalFiles();
      setPreparedFiles(files);

      if (isAnonymousVoting && (!existingAnonConfig || resetAnonKeys)) {
        // Show explicit config step
        setStep(5);
        return;
      }

      await startProposalCreation(files);
    } catch (err: any) {
      console.error(err.message);
      setError(err.message);
      setStep(0);
    }
  };

  const validateProposalNameField = (): boolean => {
    const error = validateProposalName(proposalName);
    setProposalNameError(error);
    return error === null;
  };

  const validateDescriptionField = (): boolean => {
    const error = validateTextContent(mdText, 10, "Proposal description");
    setDescriptionError(error);
    return error === null;
  };

  const validateApproveOutcome = (isFinalSubmission = false): boolean => {
    const descError = validateTextContent(
      approveDescription,
      3,
      "Approved outcome description",
    );

    setApproveDescriptionError(descError);
    setApproveXdrError(null);
    setApproveContractError(null);

    // For step navigation, only validate description
    if (!isFinalSubmission) {
      return descError === null;
    }

    // For final submission, validate based on mode
    if (approveMode === "contract") {
      // If contract address is provided but function is not selected, that's okay for submission
      // The user can submit with a contract address but no function selected
      // Only validate that if both address and function are provided, args should be valid
      if (
        approveContract?.address?.trim() &&
        approveContract?.execute_fn?.trim() &&
        approveContract.args &&
        approveContract.args.length === 0
      ) {
        // If function is selected but no args, that's potentially an issue
        // But we'll allow it for now as the contract might not need args
      }
    } else if (approveMode === "xdr") {
      // XDR mode doesn't require validation - empty XDR is fine
    } else if (approveMode === "none") {
      // No additional validation needed - description only
    }

    return descError === null;
  };

  // Automatically donwload keys on first checking of anonymous voting check
  const handleToggleAnonymous = async (checked: boolean) => {
    setIsAnonymousVoting(checked);

    if (!checked) {
      setExistingAnonConfig(false);
      setGeneratedKeys(null);
      setKeysDownloaded(false);
      return;
    }

    if (!projectName) return;

    try {
      const { hasAnonymousVotingConfig } =
        await import("@service/ReadContractService");

      const exists = await hasAnonymousVotingConfig(projectName);

      if (exists) {
        setExistingAnonConfig(true);
        setResetAnonKeys(false);
        return;
      }

      if (!generatedKeys) {
        const keys = await generateRSAKeyPair();
        setGeneratedKeys(keys);
        setExistingAnonConfig(false);
        setResetAnonKeys(false);
        downloadKeys(keys);
      }
    } catch (error) {
      console.error("Error checking anonymous config:", error);

      if (!generatedKeys) {
        const keys = await generateRSAKeyPair();
        setGeneratedKeys(keys);
        setExistingAnonConfig(false);
        setResetAnonKeys(false);
        downloadKeys(keys);
      }
    }
  };

  const downloadKeys = (keys: any) => {
    if (!keys) return;
    const blob = new Blob([JSON.stringify(keys)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tansu-anonymous-keys.json";
    a.click();
    URL.revokeObjectURL(url);
    setKeysDownloaded(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setStep(1);
  };

  if (!showModal) return <></>;

  return (
    <FlowProgressModal
      isOpen={showModal}
      onClose={handleCloseModal}
      onSuccess={() => {
        setShowModal(false);
        navigate(`/proposal?id=${proposalId}&name=${projectName}`);
      }}
      step={step}
      setStep={setStep}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isUploading={isUploading}
      setIsUploading={setIsUploading}
      isSuccessful={isSuccessful}
      setIsSuccessful={setIsSuccessful}
      error={error}
      setError={setError}
      signLabel="proposal"
      successTitle="Your Proposal Is Live!"
      successMessage="Congratulations! You've successfully submitted your proposal. Let's move forward and make it a success!"
    >
      {step == 1 ? (
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Header section */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="flex-shrink-0">
              <img
                src="/images/idea.svg"
                alt="Idea icon"
                className="w-16 h-16 lg:w-20 lg:h-20 mx-auto lg:mx-0"
              />
            </div>
            <div className="flex-grow space-y-6 lg:space-y-8">
              <div className="text-center lg:text-left">
                <Step step={step} totalSteps={4} />
                <Title
                  title="Basic Information"
                  description="Enter the title and description for your proposal to begin."
                />
              </div>

              {/* Anonymous voting section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="anonymousCheckbox"
                    checked={isAnonymousVoting}
                    onChange={(e) => handleToggleAnonymous(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="anonymousCheckbox"
                    className="text-sm font-medium text-secondary"
                  >
                    Enable anonymous voting
                  </label>
                </div>

                <div className="space-y-2">
                  {isAnonymousVoting &&
                    keysDownloaded &&
                    !existingAnonConfig && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <span className="text-sm text-green-800">
                          Your anonymous key file has been downloaded. Keep it
                          safe — it will be required to finalize voting when
                          executing the proposal.
                        </span>
                      </div>
                    )}

                  {isAnonymousVoting && existingAnonConfig && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-800">
                          Already configured.
                        </span>
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700 underline text-sm"
                          onClick={async () => {
                            const keys = await generateRSAKeyPair();
                            setGeneratedKeys(keys);
                            setResetAnonKeys(true);
                            setKeysDownloaded(false);
                            downloadKeys(keys);
                          }}
                        >
                          Reset Keys
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-2xl">
                <Input
                  label="Proposal Name"
                  placeholder="Write the name"
                  value={proposalName}
                  onChange={(e) => {
                    setProposalName(e.target.value);
                    setProposalNameError(null);
                  }}
                  error={proposalNameError}
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-primary">Description</p>
              <span className="text-sm text-secondary">
                Supports Markdown formatting
              </span>
            </div>
            <div
              className={`rounded-md border ${descriptionError ? "border-red-500" : "border-zinc-700"} overflow-hidden`}
            >
              <SimpleMarkdownEditor
                value={mdText}
                onChange={(value) => {
                  setMdText(value);
                  setDescriptionError(null);
                }}
                placeholder="Input your proposal description here..."
              />
            </div>

            {/* Image upload controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <p className="text-sm text-secondary">
                    Optionally attach images and insert them into your Markdown.
                    Supported formats: PNG, JPG, JPEG, SVG, GIF (max 5MB each).
                  </p>
                </div>
                <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium whitespace-nowrap">
                  Add Image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/gif"
                    className="hidden"
                    data-testid="proposal-image-input"
                    onChange={(e) => {
                      setImageError(null);
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const allowedTypes = [
                        "image/png",
                        "image/jpeg",
                        "image/jpg",
                        "image/svg+xml",
                        "image/gif",
                      ];
                      if (!allowedTypes.includes(file.type)) {
                        setImageError(
                          "Unsupported image type. Allowed: png, jpg, jpeg, svg, gif",
                        );
                        return;
                      }
                      const maxBytes = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxBytes) {
                        setImageError(
                          "Please upload an image smaller than 5MB",
                        );
                        return;
                      }
                      const localUrl = URL.createObjectURL(file);
                      const publicUrl = `images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
                      setImageFiles((prev) => [
                        ...prev,
                        { localUrl, publicUrl, source: file },
                      ]);
                      setMdText(
                        (prev) =>
                          `${prev}${prev && !prev.endsWith("\n") ? "\n\n" : ""}![](${localUrl})\n`,
                      );
                    }}
                  />
                </label>
              </div>

              {imageError && (
                <p className="text-red-500 text-sm">{imageError}</p>
              )}

              {imageFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-primary">
                    Attached Images ({imageFiles.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {imageFiles.map((img, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 p-3 flex flex-col gap-3 rounded-lg bg-white"
                      >
                        <img
                          src={img.localUrl}
                          alt={`attachment-${idx}`}
                          className="w-full h-20 object-contain rounded"
                        />
                        <div className="flex justify-between items-center gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 underline text-xs"
                            onClick={() =>
                              setMdText(
                                (prev) =>
                                  `${prev}${prev && !prev.endsWith("\n") ? "\n\n" : ""}![](${img.localUrl})\n`,
                              )
                            }
                          >
                            Insert
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 underline text-xs"
                            onClick={() => {
                              URL.revokeObjectURL(img.localUrl);
                              setImageFiles((prev) =>
                                prev.filter((_, i) => i !== idx),
                              );
                              setMdText((prev) =>
                                prev.replaceAll(img.localUrl, ""),
                              );
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {descriptionError && (
                <p className="text-red-500 text-sm">{descriptionError}</p>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-[18px] mt-6">
            <Button type="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              data-testid="proposal-next"
              onClick={() => {
                try {
                  if (
                    !validateProposalNameField() ||
                    !validateDescriptionField()
                  )
                    throw new Error("Invalid proposal name or description");

                  if (isAnonymousVoting) {
                    if (!existingAnonConfig || resetAnonKeys) {
                      if (!generatedKeys) {
                        throw new Error(
                          "Anonymous voting keys have not been generated yet.",
                        );
                      }
                    }
                  }

                  setStep(step + 1);
                } catch (err: any) {
                  console.error(err.message);
                  toast.error("Submit proposal", err.message);
                }
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : step == 2 ? (
        <div className="flex flex-col gap-10 md:gap-14">
          {/* Header and title section */}
          <div className="flex flex-col gap-8 md:gap-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
              <img
                src="/images/cards.svg"
                alt="cards"
                className="w-20 h-auto mx-auto sm:mx-0 sm:w-24"
              />
              <div className="flex-grow flex flex-col justify-center gap-6 text-center sm:text-left">
                <Step step={step} totalSteps={4} />
                <Title
                  title="Outcome Details"
                  description="Provide descriptions and XDRs for approved, rejected, and canceled outcomes."
                />
              </div>
            </div>

            {/* Outcome Inputs */}
            <div className="space-y-8">
              {/* Approved Outcome */}
              {showApproveOutcome ? (
                <OutcomeInput
                  type="approved"
                  description={approveDescription}
                  setDescription={setApproveDescription}
                  xdr={approveXdr}
                  setXdr={setApproveXdr}
                  contractOutcome={approveContract}
                  setContractOutcome={setApproveContract}
                  mode={approveMode}
                  setMode={setApproveMode}
                  descriptionError={approveDescriptionError}
                  xdrError={approveXdrError}
                  contractError={approveContractError}
                  onDescriptionChange={() => setApproveDescriptionError(null)}
                  onXdrChange={() => setApproveXdrError(null)}
                  onModeChange={() => setApproveContractError(null)}
                  onRemove={() => setShowApproveOutcome(false)}
                  network="testnet"
                />
              ) : (
                <div className="flex justify-center">
                  <Button
                    type="secondary"
                    onClick={() => setShowApproveOutcome(true)}
                  >
                    + Add Approved Outcome
                  </Button>
                </div>
              )}

              {/* Rejected Outcome */}
              {showRejectOutcome ? (
                <OutcomeInput
                  type="rejected"
                  description={rejectDescription}
                  setDescription={setRejectDescription}
                  xdr={rejectXdr}
                  setXdr={setRejectXdr}
                  contractOutcome={rejectContract}
                  setContractOutcome={setRejectContract}
                  mode={rejectMode}
                  setMode={setRejectMode}
                  onRemove={() => setShowRejectOutcome(false)}
                  network="testnet"
                />
              ) : (
                <div className="flex justify-center">
                  <Button
                    type="secondary"
                    onClick={() => setShowRejectOutcome(true)}
                  >
                    + Add Rejected Outcome
                  </Button>
                </div>
              )}

              {/* Cancelled Outcome */}
              {showCancelledOutcome ? (
                <OutcomeInput
                  type="cancelled"
                  description={cancelledDescription}
                  setDescription={setCancelledDescription}
                  xdr={cancelledXdr}
                  setXdr={setCancelledXdr}
                  contractOutcome={cancelledContract}
                  setContractOutcome={setCancelledContract}
                  mode={cancelledMode}
                  setMode={setCancelledMode}
                  onRemove={() => setShowCancelledOutcome(false)}
                  network="testnet"
                />
              ) : (
                <div className="flex justify-center">
                  <Button
                    type="secondary"
                    onClick={() => setShowCancelledOutcome(true)}
                  >
                    + Add Cancelled Outcome
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sm:gap-6">
            <Button
              type="secondary"
              onClick={() => setStep(step - 1)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              data-testid="proposal-next"
              onClick={() => {
                try {
                  // Validate basic information (step 1)
                  if (!validateProposalNameField()) {
                    throw new Error("Invalid proposal name");
                  }
                  if (!validateDescriptionField()) {
                    throw new Error("Invalid proposal description");
                  }

                  setStep(step + 1);
                } catch (err: any) {
                  console.error(err.message);
                  toast.error("Submit proposal", err.message);
                }
              }}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          </div>
        </div>
      ) : step == 3 ? (
        <div className="flex flex-col gap-10 md:gap-14">
          {/* Header and content */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8">
            <img
              src="/images/clock.svg"
              alt="clock icon"
              className="w-20 h-auto mx-auto sm:mx-0 sm:w-24"
            />

            <div className="flex-grow flex flex-col justify-center gap-6 sm:gap-8 text-center sm:text-left">
              <Step step={step} totalSteps={4} />
              <Title
                title="Voting Duration"
                description="Enter the number of days for the voting period."
              />

              {/* Voting Duration Controls */}
              <div className="flex flex-col gap-4 sm:gap-6">
                <p className="leading-4 text-base font-semibold text-primary">
                  Select End Day
                </p>

                <div className="flex flex-col gap-6">
                  <DatePicker
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-sm sm:text-base">
                    <p className="leading-4 text-secondary">
                      Minimum duration:
                    </p>
                    <p className="leading-4 font-semibold text-primary">
                      1 day
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sm:gap-6">
            <Button
              type="secondary"
              onClick={() => setStep(step - 1)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>

            <Button
              data-testid="proposal-next"
              onClick={() => {
                try {
                  // Compute hour difference between now and the picked calendar date
                  let diffMs = new Date(selectedDate).getTime() - Date.now();
                  let diffHours = diffMs / (1000 * 60 * 60);

                  // Ensure at least 25 hours of duration
                  if (diffHours < 25) {
                    const corrected = new Date(
                      Date.now() + 25 * 60 * 60 * 1000,
                    );
                    setSelectedDate(corrected);
                    diffMs = corrected.getTime() - Date.now();
                    diffHours = diffMs / (1000 * 60 * 60);
                  }

                  if (diffHours > 30 * 24)
                    throw new Error("Voting duration cannot exceed 30 days");

                  setStep(step + 1);
                } catch (err: any) {
                  console.error(err.message);
                  toast.error("Submit proposal", err.message);
                }
              }}
              className="w-full sm:w-auto"
            >
              Next
            </Button>
          </div>
        </div>
      ) : step == 4 ? (
        <div className="flex flex-col gap-10 md:gap-14">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <img
              src="/images/note.svg"
              alt="note icon"
              className="w-20 h-auto mx-auto sm:mx-0 sm:w-24"
            />

            <div className="flex-grow flex flex-col justify-center gap-6 sm:gap-8 text-center sm:text-left">
              <Step step={step} totalSteps={4} />
              <Title
                title="Review and Submit Your Proposal"
                description="Take a moment to review your proposal before submitting. You can go back and make changes if needed."
              />
              {/* Note to the user */}
              <p className="px-3 py-1 text-sm sm:text-base bg-[#F5F1F9] text-primary">
                ℹ️ Creating a proposal requires a 110 XLM collateral to create
                the proposal. This collateral is refunded when the vote is
                executed.
              </p>
              {/* Buttons for small screens */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sm:gap-6">
                <Button
                  type="secondary"
                  onClick={() => setStep(step - 1)}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  onClick={handleRegisterProposal}
                  data-testid="proposal-register"
                  className="w-full sm:w-auto"
                >
                  Register Proposal
                </Button>
              </div>
            </div>
          </div>

          {/* Review Sections */}
          <div className="flex flex-col gap-8 sm:gap-10">
            {/* First Step */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-lg sm:text-xl font-medium text-primary">
                  First Step
                </p>
                <Button
                  type="secondary"
                  size="sm"
                  className="px-3 py-1 text-sm sm:text-base"
                  onClick={() => setStep(1)}
                >
                  Back to the First Step
                </Button>
              </div>
              <Label label="Proposal name">
                <p className="text-lg sm:text-xl text-primary break-words">
                  {proposalName}
                </p>
              </Label>
              <Label label="Proposal description">
                <ExpandableText>{mdText}</ExpandableText>
              </Label>
            </div>

            <div className="h-[1px] bg-[#ECE3F4]" />

            {/* Second Step */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-lg sm:text-xl font-medium text-primary">
                  Second Step
                </p>
                <Button
                  type="secondary"
                  size="sm"
                  className="px-3 py-1 text-sm sm:text-base"
                  onClick={() => setStep(2)}
                >
                  Back to the Second Step
                </Button>
              </div>

              {(() => {
                const outcomes = [
                  {
                    type: "approved",
                    desc: approveDescription,
                    xdr: approveXdr,
                    contract: approveContract,
                    mode: approveMode,
                    show: showApproveOutcome,
                  },
                  {
                    type: "rejected",
                    desc: rejectDescription,
                    xdr: rejectXdr,
                    contract: rejectContract,
                    mode: rejectMode,
                    show: showRejectOutcome,
                  },
                  {
                    type: "cancelled",
                    desc: cancelledDescription,
                    xdr: cancelledXdr,
                    contract: cancelledContract,
                    mode: cancelledMode,
                    show: showCancelledOutcome,
                  },
                ];

                // Check if all outcomes are empty/unconfigured
                const allEmpty = outcomes.every(
                  (outcome) =>
                    !outcome.show ||
                    (outcome.mode === "none" && !outcome.desc?.trim()) ||
                    (outcome.mode === "contract" &&
                      !outcome.contract?.address?.trim()) ||
                    (outcome.mode === "xdr" && !outcome.xdr?.trim()),
                );

                if (allEmpty) {
                  return (
                    <Label label="Contract Calls">
                      <p className="text-base sm:text-lg text-secondary">
                        None
                      </p>
                    </Label>
                  );
                }

                // Show configured outcomes
                return outcomes
                  .filter((outcome) => outcome.show)
                  .map(({ type, desc, xdr, contract, mode }, index) => (
                    <div key={index} className="flex flex-col gap-4">
                      <p
                        className={`text-lg sm:text-xl font-medium text-${type}`}
                      >
                        {capitalizeFirstLetter(type)} Outcome
                      </p>
                      <Label label="Description">
                        <ExpandableText>{desc}</ExpandableText>
                      </Label>

                      {/* Show XDR for XDR mode */}
                      {mode === "xdr" && xdr?.trim() && (
                        <Label label="XDR Transaction">
                          <p className="text-base sm:text-lg text-primary break-all font-mono">
                            {xdr}
                          </p>
                        </Label>
                      )}

                      {/* Show message for none mode */}
                      {mode === "none" && (
                        <Label label="Action">
                          <p className="text-base sm:text-lg text-secondary">
                            No automated action - description only
                          </p>
                        </Label>
                      )}

                      {/* Show Contract details for contract mode */}
                      {mode === "contract" &&
                        contract?.address?.trim() &&
                        contract?.execute_fn?.trim() && (
                          <>
                            <Label label="Contract Address">
                              <p className="text-base sm:text-lg text-primary break-all font-mono">
                                {contract.address}
                              </p>
                            </Label>
                            <Label label="Function Call">
                              <div className="space-y-2">
                                <p className="text-base sm:text-lg text-primary font-medium">
                                  {contract.execute_fn}()
                                </p>
                                {contract.args && contract.args.length > 0 && (
                                  <div>
                                    <p className="text-sm text-secondary mb-1">
                                      Parameters:
                                    </p>
                                    <div className="text-sm bg-gray-50 p-2 rounded border space-y-1">
                                      {contract.args.map((arg, i) => (
                                        <div
                                          key={i}
                                          className="flex justify-between items-center"
                                        >
                                          <span className="font-medium text-primary">
                                            {getParamName(
                                              contract.execute_fn,
                                              i,
                                            )}
                                            :
                                          </span>
                                          <span className="font-mono text-secondary ml-2 break-all text-right">
                                            {formatContractValue(arg)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Label>
                          </>
                        )}

                      {/* Show contract address only when entered but no function selected */}
                      {mode === "contract" &&
                        contract?.address?.trim() &&
                        !contract?.execute_fn?.trim() && (
                          <Label label="Contract Address">
                            <p className="text-base sm:text-lg text-primary break-all font-mono">
                              {contract.address}
                            </p>
                            <p className="text-sm text-secondary mt-1">
                              (Function not selected)
                            </p>
                          </Label>
                        )}
                    </div>
                  ));
              })()}
            </div>

            <div className="h-[1px] bg-[#ECE3F4]" />

            {/* Third Step */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-lg sm:text-xl font-medium text-primary">
                  Third Step
                </p>
                <Button
                  type="secondary"
                  size="sm"
                  className="px-3 py-1 text-sm sm:text-base"
                  onClick={() => setStep(3)}
                >
                  Back to the Third Step
                </Button>
              </div>
              <Label label="Voting End Day">
                <p className="text-base sm:text-lg text-primary">
                  {formatDate(selectedDate.toISOString())}
                </p>
              </Label>
            </div>
          </div>

          {/* Bottom Buttons (repeated for desktop) */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 sm:gap-6">
            <Button
              type="secondary"
              onClick={() => setStep(step - 1)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              onClick={handleRegisterProposal}
              data-testid="proposal-register"
              className="w-full sm:w-auto"
            >
              Register Proposal
            </Button>
          </div>
        </div>
      ) : step === 5 &&
        isAnonymousVoting &&
        (!existingAnonConfig || resetAnonKeys) ? (
        <div
          className="flex flex-col gap-10 md:gap-12"
          data-testid="anon-setup-step"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8">
            <img
              src="/images/scan.svg"
              alt="scan icon"
              className="w-20 h-auto mx-auto sm:mx-0 sm:w-24"
            />

            <div className="flex-grow flex flex-col gap-4 sm:gap-6 text-center sm:text-left">
              <Step step={1} totalSteps={5} />
              <Title
                title="Configure anonymous voting"
                description="Generate keys and sign the setup transaction. This enables anonymous voting for this project."
              />

              {generatedKeys ? (
                <p className="text-sm sm:text-base text-secondary">
                  Keys are generated. Proceed to sign the setup transaction.
                </p>
              ) : (
                <p className="text-sm sm:text-base text-secondary">
                  Generating keys…
                </p>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4">
                <Button
                  data-testid="sign-setup"
                  disabled={isLoading}
                  onClick={async () => {
                    try {
                      setIsLoading(true);

                      if (!projectName) throw new Error("Project name missing");
                      if (!generatedKeys)
                        throw new Error("Anonymous keys missing");

                      await setupAnonymousVoting(
                        projectName,
                        generatedKeys.publicKey,
                        true,
                      );

                      setExistingAnonConfig(true);
                      setResetAnonKeys(false);

                      const files = preparedFiles || prepareProposalFiles();
                      await startProposalCreation(files);
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="absolute inset-0 bg-white flex items-center justify-center z-50">
                      <Loading />
                    </div>
                  ) : (
                    "Sign setup"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </FlowProgressModal>
  );
};

export default CreateProposalModal;
