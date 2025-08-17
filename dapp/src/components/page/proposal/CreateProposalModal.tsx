// Removed heavy @mdxeditor/editor imports - using SimpleMarkdownEditor instead
import { getProjectFromName } from "@service/ReadContractService";
import Button from "components/utils/Button";
import { DatePicker } from "components/utils/DatePicker";
import { ExpandableText } from "components/utils/ExpandableText";
import Input from "components/utils/Input";
import Label from "components/utils/Label";
import Modal from "components/utils/Modal";
import Step from "components/utils/Step";
import Title from "components/utils/Title";
import { useCallback, useEffect, useState } from "react";
import type { ProposalOutcome } from "types/proposal";
import { formatDate } from "utils/formatTimeFunctions";
import { connectedPublicKey } from "utils/store";
import { capitalizeFirstLetter, toast } from "utils/utils";
import { getIpfsBasicLink } from "utils/ipfsFunctions";
import { validateProposalName, validateTextContent } from "utils/validations";
import OutcomeInput from "./OutcomeInput";
import { generateRSAKeyPair } from "utils/crypto";
import { setupAnonymousVoting } from "@service/ContractService";
import ProgressStep from "components/utils/ProgressStep";

import SimpleMarkdownEditor from "components/utils/SimpleMarkdownEditor";
//
import { navigate } from "astro:transitions/client";

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
  const [approveXdr, setApproveXdr] = useState("");
  const [rejectXdr, setRejectXdr] = useState<string | null>(null);
  const [cancelledXdr, setCancelledXdr] = useState<string | null>(null);
  // Default to 2 days in the future to comfortably exceed the 24h minimum
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  });
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [ipfsLink, setIpfsLink] = useState("");
  const [isAnonymousVoting, setIsAnonymousVoting] = useState(false);
  const [preparedFiles, setPreparedFiles] = useState<File[] | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<{
    publicKey: string;
    privateKey: string;
  } | null>(null);
  const [existingAnonConfig, setExistingAnonConfig] = useState<boolean>(false);
  const [resetAnonKeys, setResetAnonKeys] = useState<boolean>(false);
  const [_, setKeysDownloaded] = useState<boolean>(false);
  const [proposalNameError, setProposalNameError] = useState<string | null>(
    null,
  );
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [approveDescriptionError, setApproveDescriptionError] = useState<
    string | null
  >(null);
  const [approveXdrError, setApproveXdrError] = useState<string | null>(null);

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
    connectedPublicKey.subscribe((publicKey) => setConnectedAddress(publicKey));
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
      return () =>
        showModalButton.removeEventListener("click", handleSubmmitProposal);
    }

    return;
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
    const proposalOutcome: ProposalOutcome = {
      approved: {
        description: approveDescription,
        xdr: approveXdr,
      },
      rejected: {
        description: rejectDescription,
        xdr: rejectXdr || "",
      },
      cancelled: {
        description: cancelledDescription,
        xdr: cancelledXdr || "",
      },
    };

    const outcome = new Blob([JSON.stringify(proposalOutcome)], {
      type: "application/json",
    });

    let files: File[] = [new File([outcome], "outcomes.json")];
    let description = mdText;

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

  const startProposalCreation = async (files: File[]) => {
    try {
      // Step progression handled by FlowService onProgress: 7-sign, 8-upload, 9-send
      setStep(6);

      // 2️⃣  Calculate voting end timestamp & build proposal transaction
      // Ensure at least 25h window between now and voting end
      let targetTs = new Date(selectedDate).getTime();
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

      const { createProposalFlow } = await import("@service/FlowService");

      const proposalId = await createProposalFlow({
        projectName: projectName!,
        proposalName,
        proposalFiles: files,
        votingEndsAt: votingEndsAt,
        publicVoting: !isAnonymousVoting ? true : false,
        onProgress: setStep,
      });

      setProposalId(proposalId);

      // 3️⃣  Compute IPFS link for UI reference
      const { calculateDirectoryCid } = await import("utils/ipfsFunctions");
      const cid = await calculateDirectoryCid(files);
      setIpfsLink(getIpfsBasicLink(cid));

      // Done (Step 5 in ProgressStep terms)
      setStep(10);
    } catch (err: any) {
      console.error(err.message);
      toast.error("Submit proposal", err.message);
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
      toast.error("Submit proposal", err.message);
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

  const validateApproveOutcome = (): boolean => {
    const descError = validateTextContent(
      approveDescription,
      3,
      "Approved outcome description",
    );

    setApproveDescriptionError(descError);
    setApproveXdrError(null);

    return descError === null;
  };

  const handleToggleAnonymous = async (checked: boolean) => {
    setIsAnonymousVoting(checked);
    if (!checked) return;
    if (!projectName) {
      return;
    }

    try {
      const { hasAnonymousVotingConfig } = await import(
        "@service/ReadContractService"
      );
      const exists = await hasAnonymousVotingConfig(projectName);
      if (exists) {
        setExistingAnonConfig(true);
        setResetAnonKeys(false);
        setGeneratedKeys(null);
      } else {
        setExistingAnonConfig(false);
        const keys = await generateRSAKeyPair();
        setGeneratedKeys(keys);
        setResetAnonKeys(false);
      }
    } catch (_) {
      // Network or unexpected – treat as missing config but do not log/toast
      setExistingAnonConfig(false);
      const keys = await generateRSAKeyPair();
      setGeneratedKeys(keys);
      setResetAnonKeys(false);
    }
  };

  const downloadKeys = () => {
    if (!generatedKeys) return;
    const blob = new Blob([JSON.stringify(generatedKeys)], {
      type: "application/json",
    });
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
    if (step >= 10) {
      window.location.reload();
    }
  };

  if (!showModal) return <></>;

  return (
    <Modal onClose={handleCloseModal}>
      {step == 1 ? (
        <div className="flex flex-col gap-[42px]">
          <div className="flex flex-col gap-[30px]">
            <div className="flex gap-[18px]">
              <img src="/images/idea.svg" />
              <div className="flex-grow flex flex-col justify-center gap-[30px]">
                <Step step={step} totalSteps={4} />
                <Title
                  title="Basic Information"
                  description="Enter the title and description for your proposal to begin."
                />
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="anonymousCheckbox"
                    checked={isAnonymousVoting}
                    onChange={(e) => handleToggleAnonymous(e.target.checked)}
                  />
                  <label
                    htmlFor="anonymousCheckbox"
                    className="text-sm text-secondary"
                  >
                    Enable anonymous voting
                  </label>
                  {isAnonymousVoting &&
                    existingAnonConfig &&
                    !resetAnonKeys && (
                      <span className="text-sm text-green-600">
                        Existing anonymous voting keys are already configured.
                      </span>
                    )}
                  {isAnonymousVoting &&
                    existingAnonConfig &&
                    !resetAnonKeys && (
                      <button
                        type="button"
                        className="text-blue-500 underline text-sm"
                        onClick={async () => {
                          const keys = await generateRSAKeyPair();
                          setGeneratedKeys(keys);
                          setResetAnonKeys(true);
                          setKeysDownloaded(false);
                        }}
                      >
                        Reset keys
                      </button>
                    )}
                  {isAnonymousVoting && generatedKeys && (
                    <button
                      type="button"
                      className="text-blue-500 underline text-sm"
                      onClick={downloadKeys}
                    >
                      Download keys
                    </button>
                  )}
                </div>
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
            <div className="flex flex-col gap-[18px]">
              <p className="text-base font-[600] text-primary">Description</p>
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
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary">
                    Optionally attach images and insert them into your Markdown.
                  </p>
                  <label className="cursor-pointer text-primary underline text-sm">
                    Add image
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
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-secondary">Attached images</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imageFiles.map((img, idx) => (
                        <div
                          key={idx}
                          className="border p-2 flex flex-col gap-2"
                        >
                          <img
                            src={img.localUrl}
                            alt={`attachment-${idx}`}
                            className="w-full h-24 object-contain"
                          />
                          <div className="flex justify-between items-center text-xs">
                            <button
                              type="button"
                              className="text-blue-600 underline"
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
                              className="text-red-600 underline"
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
              </div>
              {descriptionError && (
                <p className="text-red-500 text-sm">{descriptionError}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
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

                  // additional anonymous voting validation
                  if (isAnonymousVoting) {
                    if (!existingAnonConfig || resetAnonKeys) {
                      // Only require keys to be generated; downloading is encouraged but not blocking
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
        <div className="flex flex-col gap-[42px]">
          <div className="flex flex-col gap-[30px]">
            <div className="flex gap-[18px]">
              <img src="/images/cards.svg" />
              <div className="flex-grow flex flex-col justify-center gap-[30px]">
                <Step step={step} totalSteps={4} />
                <Title
                  title="Outcome Details"
                  description="Provide descriptions and XDRs for approved, rejected, and canceled outcomes."
                />
              </div>
            </div>
            <OutcomeInput
              type="approved"
              description={approveDescription}
              setDescription={setApproveDescription}
              xdr={approveXdr}
              setXdr={setApproveXdr}
              descriptionError={approveDescriptionError}
              xdrError={approveXdrError}
              onDescriptionChange={() => setApproveDescriptionError(null)}
              onXdrChange={() => setApproveXdrError(null)}
            />
            <OutcomeInput
              type="rejected"
              description={rejectDescription}
              setDescription={setRejectDescription}
              xdr={rejectXdr}
              setXdr={setRejectXdr}
            />
            <OutcomeInput
              type="cancelled"
              description={cancelledDescription}
              setDescription={setCancelledDescription}
              xdr={cancelledXdr}
              setXdr={setCancelledXdr}
            />
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button
              data-testid="proposal-next"
              onClick={() => {
                try {
                  if (!validateApproveOutcome())
                    throw new Error("Invalid approved outcome");

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
      ) : step == 3 ? (
        <div className="flex flex-col gap-[42px]">
          <div className="flex gap-[18px]">
            <img src="/images/clock.svg" />
            <div className="flex-grow flex flex-col justify-center gap-[30px]">
              <Step step={step} totalSteps={4} />
              <Title
                title="Voting Duration"
                description="Enter the number of days for the voting period."
              />
              <div className="flex flex-col gap-6">
                <p className="leading-4 text-base font-semibold text-primary">
                  Select End Day
                </p>
                <div className="flex flex-col gap-[30px]">
                  <DatePicker
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                  />
                  <div className="flex gap-3">
                    <p className="leading-4 text-base text-secondary">
                      Minimum duration:
                    </p>
                    <p className="leading-4 text-base font-semibold text-primary">
                      1 day
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button
              data-testid="proposal-next"
              onClick={() => {
                try {
                  // Compute hour difference between now and the picked calendar date
                  let diffMs = new Date(selectedDate).getTime() - Date.now();
                  let diffHours = diffMs / (1000 * 60 * 60);

                  // If the user picked the next day (or any day) but the time
                  // component would make the window < 25h, bump it to 25h.
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
            >
              Next
            </Button>
          </div>
        </div>
      ) : step == 4 ? (
        <div className="flex flex-col gap-[42px]">
          <div className="flex flex-col gap-[30px]">
            <div className="flex gap-[18px]">
              <img src="/images/note.svg" />
              <div className="flex-grow flex flex-col justify-center gap-[30px]">
                <Step step={step} totalSteps={4} />
                <Title
                  title="Review and Submit Your Proposal"
                  description="Take a moment to review your proposal before submitting. You can go back and make changes if needed."
                />
                <div className="flex justify-end gap-[18px]">
                  <Button type="secondary" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleRegisterProposal}
                    data-testid="proposal-register"
                  >
                    Register Proposal
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex gap-6">
                <p className="leading-6 text-xl font-medium text-primary">
                  First Step
                </p>
                <Button
                  type="secondary"
                  size="sm"
                  className="p-[2px_10px]"
                  onClick={() => setStep(1)}
                >
                  Back to the First Step
                </Button>
              </div>
              <Label label="Proposal name">
                <p className="leading-6 text-xl text-primary">{proposalName}</p>
              </Label>
              <Label label="Proposal description">
                <ExpandableText>{mdText}</ExpandableText>
              </Label>
            </div>
            <div className="h-[1px] bg-[#ECE3F4]" />
            <div className="flex flex-col gap-6">
              <div className="flex gap-6">
                <p className="leading-6 text-xl font-medium text-primary">
                  Second Step
                </p>
                <Button
                  type="secondary"
                  size="sm"
                  className="p-[2px_10px]"
                  onClick={() => setStep(2)}
                >
                  Back to the Second Step
                </Button>
              </div>
              {[
                { type: "approved", desc: approveDescription, xdr: approveXdr },
                { type: "rejected", desc: rejectDescription, xdr: rejectXdr },
                {
                  type: "cancelled",
                  desc: cancelledDescription,
                  xdr: cancelledXdr,
                },
              ].map(({ type, desc, xdr }, index) => (
                <div key={index} className="flex flex-col gap-6">
                  <p className={`leading-5 text-xl text-${type}`}>
                    {capitalizeFirstLetter(type)} Outcome
                  </p>
                  <Label label="description">
                    <ExpandableText>{desc}</ExpandableText>
                  </Label>
                  <Label label="XDR">
                    <p className="leading-6 text-xl text-primary">
                      {xdr ? xdr : "-"}
                    </p>
                  </Label>
                </div>
              ))}
            </div>
            <div className="h-[1px] bg-[#ECE3F4]" />
            <div className="flex flex-col gap-6">
              <div className="flex gap-6">
                <p className="leading-6 text-xl font-medium text-primary">
                  Third Step
                </p>
                <Button
                  type="secondary"
                  size="sm"
                  className="p-[2px_10px]"
                  onClick={() => setStep(3)}
                >
                  Back to the Third Step
                </Button>
              </div>
              <Label label="Voting End Day">
                <p className="text-lg text-primary">
                  {formatDate(selectedDate.toISOString())}
                </p>
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button
              onClick={handleRegisterProposal}
              data-testid="proposal-register"
            >
              Register Proposal
            </Button>
          </div>
        </div>
      ) : step === 5 &&
        isAnonymousVoting &&
        (!existingAnonConfig || resetAnonKeys) ? (
        <div className="flex flex-col gap-[42px]" data-testid="anon-setup-step">
          <div className="flex items-start gap-[18px]">
            <img src="/images/scan.svg" />
            <div className="flex-grow flex flex-col gap-[18px]">
              <Step step={1} totalSteps={5} />
              <Title
                title="Configure anonymous voting"
                description="Generate keys and sign the setup transaction. This enables anonymous voting for this project."
              />
              {generatedKeys ? (
                <div className="text-sm text-secondary">
                  Keys are generated. Proceed to sign the setup transaction.
                </div>
              ) : (
                <div className="text-sm text-secondary">Generating keys…</div>
              )}
              <div className="flex justify-end gap-[18px]">
                <Button
                  data-testid="sign-setup"
                  onClick={async () => {
                    try {
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
                      // proceed to proposal creation
                      const files = preparedFiles || prepareProposalFiles();
                      await startProposalCreation(files);
                    } catch (e: any) {
                      toast.error("Anonymous voting setup", e.message);
                    }
                  }}
                >
                  Sign setup
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : step >= 6 && step <= 9 ? (
        <ProgressStep step={step - 5} />
      ) : (
        <div
          className="flex items-center gap-[18px]"
          data-testid="flow-success"
        >
          <img src="/images/flower.svg" />
          <div className="flex-grow flex flex-col gap-[30px]">
            <Title
              title="Your Proposal Is Live!"
              description="Congratulations! You've successfully submitted your proposal. Let's move forward and make it a success!"
            />
            <div className="flex justify-end gap-[18px]">
              <Button type="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button
                type="secondary"
                icon="/icons/share.svg"
                onClick={() => window.open(ipfsLink, "_blank")}
              >
                Share
              </Button>
              <Button
                onClick={() =>
                  navigate(`/proposal?id=${proposalId}&name=${projectName}`)
                }
              >
                View Proposal
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateProposalModal;
