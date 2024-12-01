import React from "react";
import { useState, useEffect } from "react";
import { capitalizeFirstLetter } from "utils/utils";
import type { VoteData, VoterRole, Voter } from "types/proposal";

interface VotersModalProps {
  NQGScore: number;
  voteData: VoteData | null;
  onClose: () => void;
}

const VotersModal: React.FC<VotersModalProps> = ({
  NQGScore,
  voteData,
  onClose,
}) => {
  const [voters, setVoters] = useState(voteData?.voters);

  useEffect(() => {
    setVoters(voteData?.voters);
  }, [voteData]);

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
        className="modal relative w-80 sm:w-max sm:min-w-[420px] sm:max-w-[90%] md:max-w-[620px] px-3 sm:px-4 md:px-5 py-2 sm:py-4 md:py-6 rounded-lg sm:rounded-xl md:rounded-[20px] bg-white my-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content flex flex-col gap-2 sm:gap-3 md:gap-4">
          {voters && (
            <>
              <VotersCard
                voterRole="maintainer"
                voters={voters["maintainer"]}
              />
              <VotersCard
                voterRole="contributor"
                voters={voters["contributor"]}
              />
              <VotersCard voterRole="community" voters={voters["community"]} />
            </>
          )}
        </div>
        <div className="absolute top-[18px] right-5 p-0.5 sm:p-1 md:p-1.5 bg-lime rounded-[10px] text-xl">
          {NQGScore}
        </div>
      </div>
    </div>
  );
};

export default VotersModal;

interface VoterCardProps {
  voterRole: VoterRole;
  voters: Voter[];
}

const VotersCard: React.FC<VoterCardProps> = ({ voterRole, voters }) => {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
      <div className="flex items-center">
        <div className="text-lg sm:text-xl md:text-[22px]">
          {capitalizeFirstLetter(voterRole)}
        </div>
      </div>
      <div className="flex flex-wrap min-h-10 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-1 sm:gap-y-2 md:gap-y-3">
        {voters.map((voter, index) => (
          <div
            key={index}
            onClick={() => {
              voter.github && window.open(voter.github, "_blank");
            }}
            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
          >
            <img
              src={voter.image ?? "/icons/avatar.svg"}
              alt={voter.address}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
