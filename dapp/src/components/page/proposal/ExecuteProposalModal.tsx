import { navigate } from "astro:transitions/client";
import Button from "components/utils/Button";
import Modal, { type ModalProps } from "components/utils/Modal";
import Step from "components/utils/Step";
import Title from "components/utils/Title";
import React, { useMemo, useState } from "react";
import {
  VoteResultType,
  type ProposalOutcome,
  type VoteStatus,
} from "types/proposal";
import { toast } from "utils/utils";
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

  const voteResultAndXdr: {
    voteResult: VoteResultType | null;
    xdr: string | null;
  } = useMemo(() => {
    if (voteStatus && outcome) {
      const { approve, abstain, reject } = voteStatus;
      let voteResult: VoteResultType | null = null;
      let xdr: string | null = null;
      if (approve.score + abstain.score > reject.score) {
        voteResult = VoteResultType.APPROVE;
        xdr = outcome?.approved?.xdr || null;
      } else if (reject.score < approve.score + abstain.score) {
        voteResult = VoteResultType.REJECT;
        xdr = outcome?.rejected?.xdr || null;
      } else {
        voteResult = VoteResultType.CANCEL;
        xdr = outcome?.cancelled?.xdr || null;
      }
      return { voteResult, xdr };
    } else {
      return { voteResult: null, xdr: null };
    }
  }, [voteStatus, outcome]);

  const signAndExecute = async () => {
    if (!projectName) {
      toast.error("Execute Proposal", "Project name is required");
      return;
    }

    if (proposalId === undefined) {
      toast.error("Execute Proposal", "Proposal ID is required");
      return;
    }

    if (!voteResultAndXdr.voteResult) {
      toast.error("Execute Proposal", "Vote result is required");
      return;
    }

    try {
      const { executeProposal } = await import("@service/WriteContractService");
      const res = await executeProposal(
        projectName,
        proposalId,
        voteResultAndXdr.xdr,
      );
      console.log("execute result:", res.data);
      toast.success("Congratulation!", "Proposal executed successfully");
      onClose();
    } catch (error: any) {
      toast.error("Execute Proposal", error.message);
      onClose();
    }
  };

  return (
    <Modal onClose={onClose}>
      {step == 1 ? (
        <div className="flex flex-col gap-[42px]">
          <div className="flex items-start gap-[18px]">
            <img src="/images/lock-in-box.svg" />
            <div className="flex-grow flex flex-col gap-[30px]">
              <Step step={step} totalSteps={3} />
              <Title
                title="Finalizing the Vote"
                description="The voting period has ended. Now, we need to count the votes and determine the final outcome."
              />
              <VotingResult voteStatus={voteStatus} withDetail />
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          </div>
        </div>
      ) : step == 2 ? (
        <div className="flex flex-col gap-[42px]">
          <div className="flex items-start gap-[18px]">
            <img src="/images/scan.svg" />
            <div className="flex-grow flex flex-col gap-[30px]">
              <Step step={step} totalSteps={3} />
              <Title
                title="Finalize the Vote Execution"
                description="Review the transaction details before execution. You can verify the XDR and proceed with the final step."
              />
              <VotingResult voteStatus={voteStatus} />
              {/* <div className="flex flex-col gap-[18px]">
                  <p className="leading-4 text-base text-secondary">
                    Description
                  </p>
                  <p className="text-lg text-primary">
                  </p>
                </div> */}
              <div className="flex flex-col items-start gap-[18px]">
                <p className="leading-4 text-base text-secondary">XDR</p>
                <div className="p-[8px_18px] bg-[#FFEFA8] flex items-center gap-[18px]">
                  <p className="leading-[18px] text-lg text-primary">
                    {(voteResultAndXdr.xdr || "").slice(0, 24) + "..."}
                  </p>
                  <img src="/icons/clipboard.svg" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-[18px]">
            <Button type="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button
              onClick={async () => {
                await signAndExecute();
                setStep(step + 1);
              }}
            >
              Execute Transaction
            </Button>
          </div>
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
