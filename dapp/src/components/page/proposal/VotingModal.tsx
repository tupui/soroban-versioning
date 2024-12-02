import React from "react";
import { useState } from "react";
import type { VoteType } from "types/proposal";

interface VotersModalProps {
  onClose: () => void;
}

const VotingModal: React.FC<VotersModalProps> = ({ onClose }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleVote = () => {
    if (!selectedOption) {
      alert("You should select one option to vote");
      return;
    }
    alert(`You voted to "${selectedOption}" option!`);
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
            className="bg-black text-white mt-4 mb-1 py-1 px-4 rounded-lg text-lg"
            onClick={handleVote}
          >
            Vote
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
      />
      <span className="rounded-full w-4 h-4 bg-zinc-200 border border-zinc-600 flex justify-center items-center">
        <span
          className={`rounded-full w-2.5 h-2.5 ${option === value && "bg-approved"}`}
        ></span>
      </span>
      <p
        className={`px-3 py-0.5 ${bgColor} rounded-lg text-white text-lg font-medium`}
      >
        {label}
      </p>
    </label>
  );
};
