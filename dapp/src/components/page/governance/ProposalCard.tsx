import { useStore } from "@nanostores/react";
import { navigate } from "astro:transitions/client";
import React from "react";
import type { ProposalCardView } from "types/proposal";
import { calculateDateDifference } from "utils/formatTimeFunctions";
import { projectNameForGovernance } from "utils/store";
import ProposalStatusShow from "./ProposalStatusShow";

const ProposalCard: React.FC<ProposalCardView> = ({
  proposalNumber,
  proposalTitle,
  proposalStatus,
  endDate,
}) => {
  const projectName = useStore(projectNameForGovernance);

  return (
    <div
      className="p-[30px] w-full flex flex-col gap-[30px] bg-white cursor-pointer"
      onClick={() =>
        navigate(`/proposal?id=${proposalNumber}&name=${projectName}`)
      }
    >
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-center gap-[18px]">
          {endDate && calculateDateDifference(endDate) && (
            <p className="leading-[18px] text-[18px] text-[#311255]">
              Ends in {calculateDateDifference(endDate)}
            </p>
          )}
          <ProposalStatusShow proposalStatus={proposalStatus} />
        </div>
        <p className="leading-6 text-xl font-medium text-[#311255]">
          {proposalNumber} {proposalTitle}
        </p>
      </div>
      {/* <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            {proposalStatus === "voted" && (
              <div className="text-xs sm:text-sm md:text-base text-zinc-800 font-medium">
                Pending execution
              </div>
            )}
          </div>
        </div>
      </div> */}
      {/* <div className="flex lg:hidden">
        <div className="pl-2 sm:pl-3 md:pl-4">
          {proposalStatus === "voted" && (
            <div className="text-xs sm:text-sm md:text-base text-zinc-800 font-medium">
              Pending execution
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default ProposalCard;
