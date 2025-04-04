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
import * as Client from "@web3-storage/w3up-client";
import * as Delegation from "@web3-storage/w3up-client/delegation";
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
import { connectedPublicKey, projectNameForGovernance } from "utils/store";
import { capitalizeFirstLetter, getIpfsBasicLink, toast } from "utils/utils";
import OutcomeInput from "./OutcomeInput";

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
    projectNameForGovernance.subscribe((projectName) =>
      setProjectName(projectName),
    );

    const showModalButton = document.querySelector("#create-proposal-button");
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
        const res = await getProjectFromName(projectName);
        const projectInfo = res.data;
        if (projectInfo?.maintainers) {
          setMaintainers(projectInfo.maintainers);
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

  const isDescriptionValid = (description: string, words: number = 3) => {
    return description.trim().split(/\s+/).length >= words;
  };

  function getDeltaDays(selectedDate: string | Date): number {
    const now = new Date();
    const targetDate = new Date(selectedDate);

    now.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffInMs = targetDate.getTime() - now.getTime();
    return diffInMs / (1000 * 60 * 60 * 24);
  }

  const handleRegisterProposal = async () => {
    try {
      setStep(5);

      checkSubmitAvailability();

      setStep(6);

      const client = await Client.create();
      const apiUrl = `/api/w3up-delegation`;

      const { generateChallengeTransaction } = await import(
        "@service/ChallengeService"
      );

      const did = client.agent.did();

      setStep(7);

      const signedTxXdr = await generateChallengeTransaction(did);

      setStep(8);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTxXdr, projectName, did }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.arrayBuffer();

      const delegation = await Delegation.extract(new Uint8Array(data));
      if (!delegation.ok) {
        throw new Error("Failed to extract delegation", {
          cause: delegation.error,
        });
      }

      const space = await client.addSpace(delegation.ok);

      await client.setCurrentSpace(space.did());

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

      const directoryCid = await client.uploadDirectory(files);
      if (!directoryCid) throw new Error("Failed to upload proposal");

      setStep(9);

      const { createProposal } = await import("@service/WriteContractService");

      const votingDays = getDeltaDays(selectedDate);
      const res = await createProposal(
        projectName!,
        proposalName,
        directoryCid.toString(),
        Math.floor(Date.now() / 1000) + 86400 * votingDays,
      );

      setProposalId(res);
      setIpfsLink(getIpfsBasicLink(directoryCid.toString()));

      setStep(10);
    } catch (err: any) {
      console.error(err.message);
      toast.error("Submit proposal", err.message);
    }
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
                <Input
                  label="Proposal Name"
                  placeholder="Write the name"
                  value={proposalName}
                  onChange={(e) => setProposalName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-[18px]">
              <p className="text-base font-[600] text-primary">Description</p>
              <div className="rounded-md border border-zinc-700 overflow-hidden">
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
                  onChange={(value) => setMdText(value || "")}
                  placeholder="Input your proposal description here..."
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  if (proposalName.length < 10 || proposalName.length > 256)
                    throw new Error("Proposal name is required");

                  if (!isDescriptionValid(mdText, 10))
                    throw new Error(
                      "Proposal description must contain at least 10 words.",
                    );

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
                  if (!isDescriptionValid(approveDescription))
                    throw new Error(
                      "Approved description must contain at least 3 words.",
                    );

                  if (rejectXdr && !isDescriptionValid(rejectDescription))
                    throw new Error(
                      "Rejected description must contain at least 3 words.",
                    );

                  if (cancelledXdr && !isDescriptionValid(cancelledDescription))
                    throw new Error(
                      "Cancelled description must contain at least 3 words.",
                    );

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
                  const votingDays = getDeltaDays(selectedDate);

                  if (votingDays < 1 || votingDays > 30)
                    throw new Error("Voting days must be between 5 and 30");

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
        <div className="flex flex-col gap-[30px]">
          <div className="flex gap-[18px]">
            <img src="/images/loading.svg" />
            <div className="flex-grow flex flex-col justify-center gap-[30px]">
              <Step step={step - 4} totalSteps={6} />
              {step == 5 ? (
                <Title
                  title="Verifying transaction details..."
                  description="Checking if everything is correctly set"
                />
              ) : step == 6 ? (
                <Title
                  title="Connecting to the network..."
                  description="Ensuring a stable connection"
                />
              ) : step == 7 ? (
                <Title
                  title="Waiting for confirmation..."
                  description="This might take a few seconds"
                />
              ) : step == 8 ? (
                <Title
                  title="Uploading to IPFS..."
                  description="Storing data securely"
                />
              ) : (
                <Title
                  title="Finalizing transaction..."
                  description="Completing all necessary steps"
                />
              )}
              <div className="flex justify-end gap-[18px]">
                <Button type="secondary" onClick={() => setStep(step - 1)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-[18px]">
          <img src="/images/flower.svg" />
          <div className="flex-grow flex flex-col gap-[30px]">
            <Title
              title="Your Proposal Is Live!"
              description="Congratulations! You've successfully submitted your proposal. Let’s move forward and make it a success!"
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
