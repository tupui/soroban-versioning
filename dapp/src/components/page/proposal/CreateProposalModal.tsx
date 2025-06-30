import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertAdmonition,
  InsertCodeBlock,
  InsertFrontmatter,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  useCodeBlockEditorContext,
  type CodeBlockEditorDescriptor,
} from "@mdxeditor/editor";
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
import {
  validateProposalName,
  validateTextContent,
  isContentValid,
} from "utils/validations";
import OutcomeInput from "./OutcomeInput";
import { generateRSAKeyPair } from "utils/crypto";
import { setupAnonymousVoting } from "@service/WriteContractService";
import { Buffer } from "buffer";
import ProgressStep from "components/utils/ProgressStep";

import "@mdxeditor/editor/style.css";
import { navigate } from "astro:transitions/client";

interface IImageFile {
  localUrl: string;
  publicUrl: string;
  source: File;
}

const CreateProposalModal = () => {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [maintainers, setMaintainers] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [proposalName, setProposalName] = useState("");
  const [mdText, setMdText] = useState("");
  const [imageFiles, setImageFiles] = useState<IImageFile[]>([]);
  const [approveDescription, setApproveDescription] = useState("");
  const [rejectDescription, setRejectDescription] = useState("");
  const [cancelledDescription, setCancelledDescription] = useState("");
  const [approveXdr, setApproveXdr] = useState("");
  const [rejectXdr, setRejectXdr] = useState<string | null>(null);
  const [cancelledXdr, setCancelledXdr] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [ipfsLink, setIpfsLink] = useState("");
  const [isAnonymousVoting, setIsAnonymousVoting] = useState(false);
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

  const imageUploadHandler = async (image: File) => {
    const url = URL.createObjectURL(image);
    setImageFiles([
      ...imageFiles,
      { localUrl: url, publicUrl: image.name, source: image },
    ]);
    return url;
  };

  const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
    match: (_language, _meta) => true,
    priority: 0,
    Editor: (props) => {
      const cb = useCodeBlockEditorContext();
      return (
        <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
          <textarea
            rows={5}
            cols={20}
            defaultValue={props.code}
            onChange={(e) => cb.setCode(e.target.value)}
          />
        </div>
      );
    },
  };

  const getDeltaDays = (selectedDate: string | Date): number => {
    const now = new Date();
    const targetDate = new Date(selectedDate);

    now.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffInMs = targetDate.getTime() - now.getTime();
    return diffInMs / (1000 * 60 * 60 * 24);
  };

  const handleRegisterProposal = async () => {
    try {
      setStep(5);

      checkSubmitAvailability();

      // Prepare the proposal files
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

      let files = [new File([outcome], "outcomes.json")];
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
      if (!files) throw new Error("Failed to create proposal files");

      setStep(6);

      // 1️⃣ Anonymous voting setup if needed
      if (isAnonymousVoting) {
        if (!existingAnonConfig || resetAnonKeys) {
          if (!generatedKeys) throw new Error("Anonymous keys missing");
          await setupAnonymousVoting(
            projectName!,
            generatedKeys.publicKey,
            resetAnonKeys,
          );
        }
      }

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
        publicVoting: !isAnonymousVoting,
        onProgress: setStep,
      });

      setProposalId(proposalId);

      // 3️⃣  Compute IPFS link for UI reference
      const { calculateDirectoryCid } = await import("utils/ipfsFunctions");
      const cid = await calculateDirectoryCid(files);
      setIpfsLink(getIpfsBasicLink(cid));

      setStep(10);
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

  // Check if we can proceed with form submission based on validations
  const canProceed = (): boolean => {
    if (step === 1) {
      return proposalName.trim() !== "" && isContentValid(mdText, 10);
    }

    if (step === 2) {
      return isContentValid(approveDescription);
    }

    return true;
  };

  const handleToggleAnonymous = async (checked: boolean) => {
    setIsAnonymousVoting(checked);
    if (!checked) return;

    if (!projectName) {
      toast.error(
        "Anonymous voting",
        "Project name is required to check configuration",
      );
      return;
    }

    // compute project key & check config
    const { default: Tansu } = await import("../../../contracts/soroban_tansu");
    const pkg = await import("js-sha3");
    const { keccak256 } = pkg;
    const project_key = Buffer.from(
      keccak256.create().update(projectName).digest(),
    );
    try {
      await Tansu.get_anonymous_voting_config({ project_key });
      // config exists
      setExistingAnonConfig(true);
      setResetAnonKeys(false);
      setGeneratedKeys(null);
    } catch (_) {
      // no config → generate keys immediately
      setExistingAnonConfig(false);
      const keys = await generateRSAKeyPair();
      setGeneratedKeys(keys);
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

  if (!showModal) return <></>;

  return (
    <Modal onClose={() => setShowModal(false)}>
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
                <MDXEditor
                  plugins={[
                    markdownShortcutPlugin(),
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin({
                      imageUploadHandler,
                    }),
                    tablePlugin(),
                    codeBlockPlugin({
                      defaultCodeBlockLanguage: "ts",
                      codeBlockEditorDescriptors: [
                        PlainTextCodeEditorDescriptor,
                      ],
                    }),
                    codeMirrorPlugin({
                      codeBlockLanguages: {
                        js: "JavaScript",
                        css: "CSS",
                        rust: "Rust",
                        html: "HTML",
                        json: "JSON",
                        ts: "TypeScript",
                      },
                    }),
                    diffSourcePlugin({
                      diffMarkdown: "boo",
                    }),
                    frontmatterPlugin(),
                    toolbarPlugin({
                      toolbarClassName: "my-classname",
                      toolbarContents: () => (
                        <>
                          <UndoRedo />
                          <Separator />
                          <BoldItalicUnderlineToggles />
                          <CodeToggle />
                          <BlockTypeSelect />
                          <Separator />
                          <ListsToggle />
                          <Separator />
                          <CreateLink />
                          <InsertImage />
                          <InsertTable />
                          <Separator />
                          <InsertAdmonition />
                          <InsertThematicBreak />
                          <InsertCodeBlock />
                          <Separator />
                          <InsertFrontmatter />
                          <DiffSourceToggleWrapper>
                            <></>
                          </DiffSourceToggleWrapper>
                        </>
                      ),
                    }),
                  ]}
                  markdown={mdText}
                  onChange={(value) => {
                    setMdText(value || "");
                    setDescriptionError(null);
                  }}
                  placeholder="Input your proposal description here..."
                />
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
                      if (!generatedKeys || !keysDownloaded) {
                        throw new Error(
                          "You must generate and download anonymous voting keys before proceeding.",
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
                  <Button onClick={handleRegisterProposal}>
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
            <Button onClick={handleRegisterProposal}>Register Proposal</Button>
          </div>
        </div>
      ) : step >= 5 && step <= 9 ? (
        <ProgressStep step={step - 4} />
      ) : (
        <div className="flex items-center gap-[18px]">
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
