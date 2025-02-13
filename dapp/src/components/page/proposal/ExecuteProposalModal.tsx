import { navigate } from "astro:transitions/client";
import Button from "components/utils/Button";
import Modal, { type ModalProps } from "components/utils/Modal";
import Step from "components/utils/Step";
import Title from "components/utils/Title";
import React, { useMemo, useState } from "react";
import {
  VoteType,
  type ProposalOutcome,
  type VoteStatus,
} from "types/proposal";
import VotingResult from "./VotingResult";

interface ExecuteProposalModalProps extends ModalProps {
  projectName: string;
  proposalId: number | undefined;
  outcome: ProposalOutcome | null;
  voteStatus: VoteStatus | undefined;
}

const ExecuteProposalModal: React.FC<ExecuteProposalModalProps> = ({
  projectName,
  proposalId,
  outcome,
  voteStatus,
  onClose,
}) => {
  const [step, setStep] = useState(1);

  const voteResultAndXdr: { voteResult: VoteType | null; xdr: string | null } =
    useMemo(() => {
      if (voteStatus && outcome) {
        const { approve, abstain } = voteStatus;
        let voteResult: VoteType | null = null;
        let xdr: string | null = null;
        if (approve.score > abstain.score) {
          voteResult = VoteType.APPROVE;
          xdr = outcome?.approved?.xdr || null;
        } else if (approve.score < abstain.score) {
          voteResult = VoteType.REJECT;
          xdr = outcome?.rejected?.xdr || null;
        } else {
          voteResult = VoteType.CANCEL;
          xdr = outcome?.cancelled?.xdr || null;
        }
        return { voteResult, xdr };
      } else {
        return { voteResult: null, xdr: null };
      }
    }, [voteStatus, outcome]);

  const signAndExecute = async () => {
    if (!projectName) {
      alert("Project name is required");
      return;
    }

    if (proposalId === undefined) {
      alert("Proposal ID is required");
      return;
    }

    if (!voteResultAndXdr.voteResult) {
      alert("Vote result is required");
      return;
    }

    const { executeProposal } = await import("@service/WriteContractService");
    const res = await executeProposal(
      projectName,
      proposalId,
      voteResultAndXdr.xdr,
    );
    if (res.error) {
      alert(res.errorMessage);
      onClose();
    } else {
      console.log("execute result:", res.data);
      alert("Proposal executed successfully");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal relative w-80 sm:w-max sm:max-w-[90%] md:max-w-[620px] px-3 sm:px-5 md:px-9 py-2 sm:py-6 md:py-12 rounded-lg sm:rounded-xl md:rounded-[20px] bg-white my-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1 sm:gap-2">
          <div className="text-sm sm:text-lg md:text-[22px]">Outcome</div>
          <div className="flex flex-col gap-1 sm:gap-2 md:gap-3">
            <a
              href={`${stellarLabViewXdrLink}${modifySlashInXdr(voteResultAndXdr.xdr || "")};;`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-0.5 sm:gap-1 text-black hover:text-blue  group"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                id="Stellar--Streamline-Simple-Icons.svg"
                height="24"
                width="24"
                fill="#000000"
                className="group-hover:fill-blue w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
              >
                <path
                  d="M12.283 1.851A10.154 10.154 0 0 0 1.846 12.002c0 0.259 0.01 0.516 0.03 0.773A1.847 1.847 0 0 1 0.872 14.56L0 15.005v2.074l2.568 -1.309 0.832 -0.424 0.82 -0.417 14.71 -7.496 1.653 -0.842L24 4.85V2.776l-3.387 1.728 -2.89 1.473 -13.955 7.108a8.376 8.376 0 0 1 -0.07 -1.086 8.313 8.313 0 0 1 12.366 -7.247l1.654 -0.843 0.247 -0.126a10.154 10.154 0 0 0 -5.682 -1.932zM24 6.925 5.055 16.571l-1.653 0.844L0 19.15v2.072L3.378 19.5l2.89 -1.473 13.97 -7.117a8.474 8.474 0 0 1 0.07 1.092A8.313 8.313 0 0 1 7.93 19.248l-0.101 0.054 -1.793 0.914a10.154 10.154 0 0 0 16.119 -8.214c0 -0.26 -0.01 -0.522 -0.03 -0.78a1.848 1.848 0 0 1 1.003 -1.785L24 8.992Z"
                  strokeWidth="1"
                ></path>
              </svg>
              <span className="text-xs sm:text-sm md:text-base">
                View in Stellar Lab
              </span>
            </a>
            <div className="transition-all duration-300 max-h-24 overflow-hidden flex flex-col bg-zinc-100 border border-zinc-400 rounded-xl">
              <div className="jsonview-body w-full">
                <div className="max-h-40 md:max-h-96 overflow-y-auto px-1 sm:px-3 md:px-5 py-2 sm:py-3 md:py-4">
                  <JsonView src={content} theme="vscode" />
                </div>
              </div>
            </div>
          </div>
          <button
            className="bg-black text-white mt-4 mb-1 py-1 px-4 rounded-lg text-lg"
            onClick={signAndExecute}
          >
            Sign
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-[42px]">
          <div className="flex items-start gap-[18px]">
            <img src="/images/flower.svg" />
            <div className="flex-grow flex flex-col gap-[30px]">
              <Step step={step} totalSteps={3} />
              <Title
                title="Your Vote Is Officially Executed!"
                description="Congratulations! You've successfully executed your vote, and the final status has been updated."
              />
              <VotingResult voteStatus={voteStatus} />
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="secondary" icon="/icons/share.svg">
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
      )}
    </Modal>
  );
};

export default ExecuteProposalModal;
