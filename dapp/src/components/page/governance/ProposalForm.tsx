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
import "@mdxeditor/editor/style.css";
import { useStore } from "@nanostores/react";
import { getProjectFromName } from "@service/ReadContractService";
import * as Client from "@web3-storage/w3up-client";
import * as Delegation from "@web3-storage/w3up-client/delegation";
import { navigate } from "astro:transitions/client";
import Button from "components/utils/Button";
import Input from "components/utils/Input";
import Modal from "components/utils/Modal";
import Textarea from "components/utils/Textarea";
import React, { useEffect, useState } from "react";
import type { ProposalOutcome } from "types/proposal";
import { connectedPublicKey, projectNameForGovernance } from "utils/store";
import { capitalizeFirstLetter, getIpfsBasicLink } from "utils/utils";

const ProposalForm: React.FC = () => {
  const connectedAddress = useStore(connectedPublicKey);
  const projectName = useStore(projectNameForGovernance);
  const [projectMaintainers, setProjectMaintainers] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [proposalName, setProposalName] = useState("");
  const [mdText, setMdText] = useState("");
  const [approveDescription, setApproveDescription] = useState("");
  const [rejectDescription, setRejectDescription] = useState("");
  const [cancelledDescription, setCancelledDescription] = useState("");
  const [approveXdr, setApproveXdr] = useState("");
  const [rejectXdr, setRejectXdr] = useState("");
  const [cancelledXdr, setCancelledXdr] = useState("");
  const [votingDays, setVotingDays] = useState<number>(5);
  const [imageFiles, setImageFiles] = useState<
    { localUrl: string; publicUrl: string; source: File }[]
  >([]);
  const [submittingStatus, setSubmittingStatus] = useState(0);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getProjectMaintainers = async () => {
    if (projectName) {
      const res = await getProjectFromName(projectName);
      const projectInfo = res.data;
      if (projectInfo && projectInfo.maintainers) {
        setProjectMaintainers(projectInfo?.maintainers);
      } else if (res.error) {
        alert(res.errorMessage);
      }
    } else {
      alert("Project name is not provided");
    }
  };

  useEffect(() => {
    if (isClient) {
      getProjectMaintainers();
    }
  }, [isClient, projectName]);

  if (!isClient) {
    return null;
  }

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

  const submitProposal = async () => {
    try {
      if (!projectName)
        throw new Error('No project is selected');

      if (proposalName.length < 10 || proposalName.length > 256)
        throw new Error("Proposal name is required");

      if (votingDays < 1 || votingDays > 30)
        throw new Error("Voting days must be between 5 and 30");

      if (!isDescriptionValid(mdText, 10))
        throw new Error("Proposal description must contain at least 10 words.");

      if (!isDescriptionValid(approveDescription))
        throw new Error("Approved description must contain at least 3 words.");

      if (rejectXdr && !isDescriptionValid(rejectDescription))
        throw new Error("Rejected description must contain at least 3 words.");

      if (cancelledXdr && !isDescriptionValid(cancelledDescription))
        throw new Error("Cancelled description must contain at least 3 words.");

      if (!connectedAddress)
        throw new Error("Please connect your wallet first");

      if (!projectMaintainers.includes(connectedAddress))
        throw new Error("You are not a maintainer of this project");

      setSubmittingStatus(1);

      const client = await Client.create();
      const apiUrl = `/api/w3up-delegation`;


      const { generateChallengeTransaction } = await import(
        "@service/ChallengeService"
      );

      const did = client.agent.did();

      const signedTxXdr = await generateChallengeTransaction(did);

      setSubmittingStatus(2);

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
          xdr: rejectXdr,
        },
        cancelled: {
          description: cancelledDescription,
          xdr: cancelledXdr,
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
      if (!files)
        throw new Error('Failed to create proposal files');

      const directoryCid = await client.uploadDirectory(files);
      if (!directoryCid)
        throw new Error("Failed to upload proposal");

      setSubmittingStatus(3);

      const { createProposal } = await import("@service/WriteContractService");

      const res = await createProposal(
        projectName,
        proposalName,
        directoryCid.toString(),
        Math.floor(Date.now() / 1000) + 86400 * votingDays,
      );

      if (res.error)
        throw new Error(res.errorMessage);

      setSubmittingStatus(4);

      alert(
        `Proposal submitted successfully! Proposal ID: ${res.data}, CID: ${getIpfsBasicLink(directoryCid.toString())}`,
      );

      window.location.href = `/governance?name=${projectName}`;
    } catch (err: any) {
      console.error(err.message);
      alert(err.message);
    }
    setSubmittingStatus(0);
  };

  return (
    <>
      <div className="w-full flex flex-col gap-9">
        <div className="flex flex-col gap-3">
          <h3 className="text-2xl font-medium text-primary">Create Proposal</h3>
          <p className="text-base text-secondary">
            Draft and share your proposal for consideration, innovation, and
            collective action.
          </p>
        </div>
        <div className="flex flex-col gap-[18px]">
          <p className="text-xl font-medium text-primary">Basic Information</p>
          <div className="flex flex-col gap-[18px]">
            <p className="text-base font-[600] text-primary">Proposal Name</p>
            <Input
              placeholder="Enter your proposal name here..."
              value={proposalName}
              onChange={(e: any) => setProposalName(e.target.value)}
            />
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
                    codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor],
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
                          <div></div>
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
        <div className="flex flex-col gap-[18px]">
          <p className="text-xl font-medium text-primary">Basic Information</p>
          <div className="flex flex-col gap-[18px]">
            <p className="leading-[16px] text-base font-[600] text-primary">
              Set the duration for the voting period
            </p>
            <Input
              className="w-[440px]"
              placeholder="Enter the number of days"
              value={votingDays}
              onChange={(e) => setVotingDays(Number(e.target.value))}
            />
            <p className="leading-[16px] text-base text-[#5D4E6B]">
              Minimum duration:{" "}
              <span className="font-[600] text-primary">1 day</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-[18px]">
          <Button className="relative col-span-2" onClick={submitProposal}>
            <div className="absolute left-0 top-0 h-full" style={{ width: `${submittingStatus * 25}%`, backgroundColor: '#FFB21E' }} />
            <p className="z-10">
              {submittingStatus == 0 ?
                "Submit Proposals" :
                submittingStatus == 1 ?
                  "Signing Authorization..." :
                  submittingStatus == 2 ?
                    "Uploading to IPFS..." :
                    submittingStatus == 3 ?
                      "Registering Proposal..." :
                      "Finalizing Smart Contract..."
              }
            </p>
          </Button>
          <Button
            type="secondary"
            className="col-span-1"
            onClick={() => setShowClearAllModal(true)}
          >
            Clear All
          </Button>
          <Button
            type="secondary"
            className="col-span-1"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel
          </Button>
        </div>
      </div>
      {showClearAllModal && (
        <Modal onClose={() => setShowClearAllModal(false)}>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-[18px]">
              <h6 className="text-2xl font-medium text-primary">
                Clear All Fields
              </h6>
              <p className="text-lg text-secondary">
                Are you sure you want to clear all fields? This will erase all
                the information you've entered in this form.
              </p>
            </div>
            <div className="flex gap-[18px]">
              <Button onClick={() => setShowClearAllModal(false)}>Go Back</Button>
              <Button type="secondary" onClick={() => {
                setProposalName("");
                setMdText("");
                setApproveDescription("");
                setApproveXdr("");
                setRejectDescription("");
                setRejectXdr("");
                setCancelledDescription("");
                setCancelledXdr("");
                setVotingDays(5);
                setShowClearAllModal(false);
              }}>Clear Fields</Button>
            </div>
          </div>
        </Modal>
      )}
      {showCancelModal && (
        <Modal onClose={() => setShowCancelModal(false)}>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-[18px]">
              <h6 className="text-2xl font-medium text-primary">
                Cancel Proposal Creation
              </h6>
              <p className="text-lg text-secondary">
                Are you sure you want to cancel creating this proposal? All
                entered information will be lost.
              </p>
            </div>
            <div className="flex gap-[18px]">
              <Button onClick={() => setShowCancelModal(false)}>Go Back</Button>
              <Button type="secondary" onClick={() => navigate(`/governance?name=${projectName}`)}>Cancel Proposal</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ProposalForm;

interface OutcomeInputProps {
  type: string;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  xdr: string;
  setXdr: React.Dispatch<React.SetStateAction<string>>;
}

const OutcomeInput = ({
  type,
  description,
  setDescription,
  xdr,
  setXdr,
}: OutcomeInputProps) => {
  return (
    <div className="flex flex-col gap-[18px]">
      <div
        className={`text-xl font-medium ${type === "approved" ? "text-approved" : type === "rejected" ? "text-conflict" : type === "cancelled" && "text-abstain"}`}
      >
        {capitalizeFirstLetter(type)} Outcome
      </div>
      <div className="flex flex-col gap-[18px]">
        <p className="leading-[16px] text-base font-[600] text-primary">
          Description
        </p>
        <Textarea
          placeholder="Write the description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
          }}
        />
      </div>
      <div className="flex flex-col gap-[18px]">
        <p className="leading-[16px] text-base font-[600] text-primary">
          XDR (Optional)
        </p>
        <Textarea
          className="h-[64px]"
          placeholder="Write the XDR"
          value={xdr}
          onChange={(e) => {
            setXdr(e.target.value);
          }}
        />
      </div>
    </div>
  );
};
