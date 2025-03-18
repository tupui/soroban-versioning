import { useStore } from "@nanostores/react";
import Button from "components/utils/Button";
import React from "react";
import type { ProposalCardView } from "types/proposal";
import { calculateDateDifference } from "utils/formatTimeFunctions";
import { projectNameForGovernance } from "utils/store";
import { capitalizeFirstLetter } from "utils/utils";

interface Props extends ProposalCardView {
  onVoteClick?: () => void;
}

const ProposalCard: React.FC<Props> = ({
  proposalNumber,
  proposalTitle,
  proposalStatus,
  endDate,
  onVoteClick,
}) => {
  const projectName = useStore(projectNameForGovernance);

  return (
    <a
      href={`/proposal?id=${proposalNumber}&name=${projectName}`}
      className="p-[30px] flex flex-col gap-6 bg-white cursor-pointer"
    >
      <div className="flex justify-between">
        <p className="text-xl font-medium text-primary">{proposalTitle}</p>
        <div className="flex gap-[18px] text-xl">
          <span className="text-tertiary">ID:</span>
          <span className="text-primary">{proposalNumber}</span>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="grid grid-cols-2 gap-[18px]">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-tertiary">Status</p>
            <p className="text-lg text-tertiary">
              {proposalStatus == "voted"
                ? "Pending Execution"
                : ["approved", "rejected", "cancelled"].includes(proposalStatus)
                  ? "Finished"
                  : capitalizeFirstLetter(proposalStatus)}
            </p>
          </div>
          {["approved", "rejected", "cancelled"].includes(proposalStatus) && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-tertiary">Result</p>
              <p className={`text-lg text-${proposalStatus}`}>
                {capitalizeFirstLetter(proposalStatus)}
              </p>
            </div>
          )}
          {proposalStatus == "active" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-tertiary">End date</p>
              <p className={`text-lg text-${proposalStatus}`}>
                {calculateDateDifference(endDate)}
              </p>
            </div>
          )}
        </div>
        {proposalStatus == "active" && (
          <Button icon="/icons/vote.svg" onClick={(e) => {
            e.preventDefault();
            onVoteClick?.();
          }}>
            Vote
          </Button>
        )}
      </div>
    </a>
  );
};

export default ProposalCard;
