import React from "react";
import type { ProposalViewStatus } from "types/proposal";
import { capitalizeFirstLetter } from "utils/utils";
import { calculateDateDifference } from "../../../utils/formatTimeFunctions";

interface Props {
  status: ProposalViewStatus | null;
  endDate: number | null;
}

const ProposalStatusSection: React.FC<Props> = ({ status, endDate }) => {
  return (
    <div className="flex gap-[42px]">
      <div className="flex flex-col gap-3">
        <p className="leading-4 text-tertiary">Status</p>
        <p className={`leading-[18px] text-lg font-medium text-${status}`}>
          {capitalizeFirstLetter(status || "")}
        </p>
      </div>
      {status === "active" && endDate && (
        <div className="flex flex-col gap-3">
          <p className="leading-4 text-tertiary">End date</p>
          <p className="leading-[18px] text-lg font-medium text-primary">
            {calculateDateDifference(endDate)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProposalStatusSection;
