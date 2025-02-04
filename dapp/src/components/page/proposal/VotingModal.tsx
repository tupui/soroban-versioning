import React from "react";
import { useState } from "react";
import type { VoteType } from "types/proposal";

interface VotersModalProps {
  projectName: string;
  proposalId: number | undefined;
  isVoted: boolean;
  setIsVoted: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}

const VotingModal: React.FC<VotersModalProps> = ({
  projectName,
  proposalId,
  isVoted,
  setIsVoted,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<VoteType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async () => {
    if (!selectedOption) {
      alert("You should select one option to vote");
      return;
    }

    if (isVoted) {
      alert("You have already voted");
      onClose();
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
      setIsVoted(true);
    } else {
      setIsLoading(false);
      if (res.error) {
        const errorMessage = res.errorMessage;
        alert(errorMessage);
      }
    }
    onClose();
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
        className="modal relative w-max sm:max-w-[90%] md:max-w-[620px] px-8 py-4 rounded-[20px] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold">Vote</h2>
        <div className="flex flex-col items-center gap-5">
          <p className="text-base">Select one option to vote</p>

          <div className="flex flex-col gap-5">
            <CheckBox
              value="approve"
              option={selectedOption}
              setOption={setSelectedOption}
              label="Approve"
              bgColor="bg-interest"
            />
            <CheckBox
              value="reject"
              option={selectedOption}
              setOption={setSelectedOption}
              label="Reject"
              bgColor="bg-conflict"
            />
            <CheckBox
              value="abstain"
              option={selectedOption}
              setOption={setSelectedOption}
              label="Abstain"
              bgColor="bg-abstain"
            />
          </div>

          <button
            disabled={isLoading}
            className="bg-black w-[94px] mt-4 mb-1 py-1 px-2 rounded-lg text-lg"
            onClick={handleVote}
            data-testid="vote-button"
          >
            {isLoading ? (
              <span className="text-center text-white text-xl font-normal leading-7">
                Voting...
              </span>
            ) : (
              <span className="text-center text-white text-xl font-normal leading-7">
                Vote
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingModal;

const CheckBox: React.FC<{
  value: VoteType;
  option: string | null;
  setOption: any;
  label: string;
  bgColor: string;
}> = ({ value, option, setOption, label, bgColor }) => {
  return (
    <label className="relative flex gap-3 items-center cursor-pointer pr-2">
      <input
        type="radio"
        value={value}
        checked={option === value}
        className="opacity-0 absolute left-0 right-0 cursor-pointer"
        onChange={(e) => setOption(e.target.value)}
        data-testid={`vote-option-${value}`}
      />
      <span className="rounded-full w-4 h-4 bg-zinc-200 border border-zinc-600 flex justify-center items-center">
        <span
          className={`rounded-full w-2.5 h-2.5 ${option === value && "bg-approved"}`}
        ></span>
      </span>
      <p
        className={`w-24 py-0.5 ${bgColor} rounded-lg text-white text-center text-lg font-medium`}
      >
        {label}
      </p>
    </label>
  );
};
