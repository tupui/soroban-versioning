import React from "react";
import { calculateDateDifference } from "../../../utils/formatTimeFunctions";
import ProposalStatusDiv from "./ProposalStatusDiv";
import type { ProposalStatus } from "types/proposal";

interface Props {
  status: ProposalStatus;
  endDate: string | null;
}

const ProposalStatusSection: React.FC<Props> = ({ status, endDate }) => {
  return (
    <div className="flex items-center mt-3 sm:mt-5 md:mt-8 gap-2 sm:gap-3 md:gap-4">
      <div className="">
        <ProposalStatusDiv proposalStatus={status} />
      </div>
      <div className="hidden lg:block">
        {status === "active" && endDate && (
          <div className="text-xs sm:text-sm md:text-base text-zinc-800 font-medium">
            Ends in {calculateDateDifference(endDate)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalStatusSection;
