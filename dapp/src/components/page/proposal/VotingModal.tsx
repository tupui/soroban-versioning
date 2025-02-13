import Button from "components/utils/Button";
import Modal, { type ModalProps } from "components/utils/Modal";
import Title from "components/utils/Title";
import { voteTypeDescriptionMap, voteTypeLabelMap } from "constants/constants";
import React, { useState } from "react";
import { VoteType } from "types/proposal";
import VoteTypeCheckbox from "./VoteTypeCheckbox";

interface VotersModalProps extends ModalProps {
  projectName: string;
  proposalId: number | undefined;
  isVoted?: boolean;
  setIsVoted?: React.Dispatch<React.SetStateAction<boolean>>;
}

const VotingModal: React.FC<VotersModalProps> = ({
  projectName,
  proposalId,
  isVoted,
  setIsVoted,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<VoteType | null>(
    VoteType.APPROVE,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleVote = async () => {
    if (!selectedOption) {
      alert("You should select one option to vote");
      return;
    }

    if (isVoted) {
      alert("You have already voted");
      return;
    }

    setIsLoading(true);
    const { voteToProposal } = await import("@service/WriteContractService");
    if (proposalId === undefined) {
      alert("Proposal ID is required");
      return;
    }
    const res = await voteToProposal(projectName, proposalId, selectedOption);

    if (res.data) {
      setIsLoading(false);
      alert(`You have successfully voted to "${selectedOption}" option.`);
      setIsVoted?.(true);
    } else {
      setIsLoading(false);
      if (res.error) {
        const errorMessage = res.errorMessage;
        alert(errorMessage);
      }
    }
    setStep(2);
  };

  return (
    <Modal onClose={onClose}>
      {step == 1 ? (
        <div className="flex items-start gap-6">
          <img
            src="/images/box-with-ball.svg"
            className="w-[360px] h-[360px]"
          />
          <div className="flex-grow flex flex-col gap-9">
            <Title
              title="Cast Your Vote"
              description={
                <div className="flex gap-1.5">
                  <p>Vote on the proposal:</p>
                  <p className="font-bold text-primary">
                    Sustainable Future Initiative
                  </p>
                </div>
              }
            />
            {[VoteType.APPROVE, VoteType.REJECT, VoteType.CANCEL].map(
              (voteType, index) => (
                <div
                  className="flex gap-3"
                  onClick={() => setSelectedOption(voteType)}
                >
                  <VoteTypeCheckbox
                    key={index}
                    voteType={voteType}
                    currentVoteType={selectedOption}
                  />
                  <div className="flex flex-col justify-center gap-3">
                    <p
                      className={`leading-5 text-xl font-medium text-${voteType}`}
                    >
                      {voteTypeLabelMap[voteType]}
                    </p>
                    <p className="leading-4 text-base font-semibold text-primary">
                      {voteTypeDescriptionMap[voteType]}
                    </p>
                  </div>
                </div>
              ),
            )}
            <div className="flex flex-col items-end gap-[18px]">
              <div className="flex gap-[18px]">
                <Button type="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => !isLoading && handleVote()}>
                  {isLoading ? "Voting..." : "Vote"}
                </Button>
              </div>
              <p className="text-base text-secondary">
                Once submitted, your vote cannot be changed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-[18px]">
          <img src="/images/box.svg" className="w-[360px] h-[360px]" />
          <div className="flex-grow flex flex-col gap-[30px]">
            <Title
              title={
                <div className="flex gap-3">
                  <VoteTypeCheckbox size="sm" voteType={selectedOption!} />
                  <span>
                    Your {voteTypeLabelMap[selectedOption!]} Vote Has Been
                    Submitted!
                  </span>
                </div>
              }
              description={
                <>
                  Thank you for voting{" "}
                  <span className={`text-${selectedOption}`}>
                    {voteTypeLabelMap[selectedOption!]}!
                  </span>{" "}
                  Your positive feedback helps this proposal move closer to
                  realization.
                </>
              }
            />
            <div className="flex justify-end gap-[18px]">
              <Button type="secondary" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onClose}>Ok</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default VotingModal;
