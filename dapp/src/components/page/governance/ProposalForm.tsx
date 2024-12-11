import React from "react";
import { useState, useEffect } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  frontmatterPlugin,
  toolbarPlugin,
  Separator,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertAdmonition,
  InsertImage,
  InsertTable,
  InsertFrontmatter,
  InsertThematicBreak,
  InsertCodeBlock,
  ListsToggle,
  type CodeBlockEditorDescriptor,
  useCodeBlockEditorContext,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useStore } from "@nanostores/react";
import * as Delegation from "@web3-storage/w3up-client/delegation";
import * as Client from "@web3-storage/w3up-client";
import { capitalizeFirstLetter, getIpfsBasicLink } from "utils/utils";
import type { ProposalOutcome } from "types/proposal";
import Loading from "components/utils/Loading";
import { connectedPublicKey, projectNameForGovernance } from "utils/store";
import { getProjectFromName } from "@service/ReadContractService";

const ProposalForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mdText, setMdText] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [approveDescription, setApproveDescription] = useState("");
  const [rejectDescription, setRejectDescription] = useState("");
  const [cancelledDescription, setCancelledDescription] = useState("");
  const [approveXdr, setApproveXdr] = useState("");
  const [rejectXdr, setRejectXdr] = useState("");
  const [cancelledXdr, setCancelledXdr] = useState("");
  const [imageFiles, setImageFiles] = useState<
    { localUrl: string; publicUrl: string; source: File }[]
  >([]);
  const connectedAddress = useStore(connectedPublicKey);
  const projectName = useStore(projectNameForGovernance);
  const [projectMaintainers, setProjectMaintainers] = useState<string[]>([]);
  const [proposalName, setProposalName] = useState("");
  const [votingDays, setVotingDays] = useState<number>(5);

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
    if (!projectName) {
      alert("Project name is required");
      return;
    }

    if (
      !proposalName ||
      proposalName.length < 10 ||
      proposalName.length > 256
    ) {
      alert("Proposal name is required");
      return;
    }

    if (votingDays < 1 || votingDays > 30) {
      alert("Voting days must be between 5 and 30");
      return;
    }

    if (!isDescriptionValid(mdText, 10)) {
      alert("Proposal description must contain at least 10 words.");
      return;
    }

    if (!isDescriptionValid(approveDescription)) {
      alert("Approved description must contain at least 3 words.");
      return;
    }

    if (rejectXdr && !isDescriptionValid(rejectDescription)) {
      alert("Rejected description must contain at least 3 words.");
      return;
    }

    if (cancelledXdr && !isDescriptionValid(cancelledDescription)) {
      alert("Cancelled description must contain at least 3 words.");
      return;
    }

    if (!connectedAddress) {
      alert("Please connect your wallet first");
      return;
    }

    if (!projectMaintainers.includes(connectedAddress)) {
      alert("You are not a maintainer of this project");
      return;
    }

    try {
      setIsLoading(true);
      const client = await Client.create();
      const apiUrl = `/api/w3up-delegation`;

      const { generateChallengeTransaction } = await import(
        "@service/ChallengeService"
      );

      const did = client.agent.did();

      const signedTxXdr = await generateChallengeTransaction(did);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTxXdr, projectName, did }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
        throw new Error(errorData.error);
      }
      const data = await response.arrayBuffer();

      const delegation = await Delegation.extract(new Uint8Array(data));
      if (!delegation.ok) {
        throw new Error("Failed to extract delegation", {
          cause: delegation.error,
        });
      }
      console.log("Delegation successfully extracted from server");

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

      if (!files) {
        alert("Failed to create proposal files");
        return;
      }

      const directoryCid = await client.uploadDirectory(files);
      console.log("Proposal successfully uploaded to IPFS");

      if (!directoryCid) {
        alert("Failed to upload proposal");
        return;
      }

      const { createProposal } = await import("@service/WriteContractService");

      const res = await createProposal(
        projectName,
        proposalName,
        directoryCid.toString(),
        Math.floor(Date.now() / 1000) + 86400 * votingDays,
      );

      setIsLoading(false);
      if (res.error) {
        alert(res.errorMessage);
      } else {
        alert(
          `Proposal submitted successfully! Proposal ID: ${res.data}, CID: ${getIpfsBasicLink(directoryCid.toString())}`,
        );

        window.location.href = `/governance?name=${projectName}`;
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error(
        "submit proposal error:",
        error?.cause ? error.cause : error,
      );
      alert("Error submitting proposal.");
    }
  };

  return (
    <div>
      <h3 className="text-base sm:text-lg md:text-[26px] font-semibold my-10 mb-3">
        Name
      </h3>
      <input
        type="text"
        value={proposalName}
        onChange={(e) => setProposalName(e.target.value)}
        className="w-full p-2 border border-zinc-700 rounded-md focus:outline-none"
        placeholder="Enter your proposal name here..."
      />
      <h3 className="text-base sm:text-lg md:text-[26px] font-semibold my-10 mb-3">
        Description
      </h3>
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
                  <BoldItalicUnderlineToggles />
                </>
              ),
            }),
          ]}
          markdown={mdText}
          onChange={(value) => setMdText(value || "")}
          placeholder="Input your proposal description here..."
        />
      </div>
      <h3 className="text-base sm:text-lg md:text-[26px] font-semibold my-10 mb-8">
        Outcome
      </h3>
      <div className="w-full max-w-[840px] mx-auto flex flex-col gap-4 sm:gap-6 md:gap-10">
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
        <div className="w-full flex items-center">
          <h5 className="w-[80px] sm:w-[90px] md:w-[105px] pr-1.5 text-right text-base text-nowrap">
            Voting dates:
          </h5>
          <input
            type="number"
            value={votingDays}
            onChange={(e) => setVotingDays(Number(e.target.value))}
            className="w-14 pr-2 text-right text-base border border-zinc-700 rounded-md focus:outline-none"
            placeholder=""
          />
          <div className="pl-1.5 text-base">days</div>
        </div>
        <div className="ml-[80px] sm:ml-[90px] md:ml-[105px]">
          <button
            className="w-full py-5 bg-zinc-900 rounded-[14px] justify-center gap-2.5 inline-flex"
            onClick={() => submitProposal()}
          >
            {isLoading ? (
              <Loading theme="dark" />
            ) : (
              <span className="text-center text-white text-xl font-normal leading-7">
                Submit Proposal
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
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
    <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
      <div className="w-min">
        <div
          className={`text-sm sm:text-base md:text-lg text-white md:py-0.5 px-1 md:px-2 rounded-sm md:rounded 
            ${type === "approved" ? "bg-approved" : type === "rejected" ? "bg-conflict" : type === "cancelled" && "bg-abstain"}`}
        >
          {capitalizeFirstLetter(type)}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
        <div className="flex items-start">
          <div className="w-[80px] sm:w-[90px] md:w-[105px] pr-1.5 flex justify-end">
            <div className="text-sm sm:text-base">Description:</div>
          </div>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            className="w-[calc(100%-80px)] sm:w-[calc(100%-90px)] md:w-[calc(100%-105px)] h-max text-sm sm:text-base rounded-md border border-zinc-700 outline-none resize-y"
          />
        </div>
        <div className="flex items-start">
          <div className="w-[80px] sm:w-[90px] md:w-[105px] pr-1.5 flex justify-end">
            <div className="text-sm sm:text-base">XDR:</div>
          </div>
          <textarea
            value={xdr}
            onChange={(e) => {
              setXdr(e.target.value);
            }}
            className="w-[calc(100%-80px)] sm:w-[calc(100%-90px)] md:w-[calc(100%-105px)] h-max text-sm sm:text-base rounded-md border border-zinc-700 outline-none resize-y"
          />
        </div>
      </div>
    </div>
  );
};
