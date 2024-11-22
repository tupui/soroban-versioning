import React from "react";
import ProposalStatusShow from "./ProposalStatusShow";
import type { ProposalCardView } from "types/proposal";
import { calculateDateDifference } from "utils/formatTimeFunctions";
import { navigate } from "astro:transitions/client";

const ProposalCard: React.FC<ProposalCardView> = ({
  proposalNumber,
  proposalTitle,
  proposalStatus,
  endDate,
}) => {
  return (
    <div
      className="w-full px-2 sm:px-4 md:pl-8 py-2 sm:py-3 md:py-4.5 bg-white border border-zinc-300 rounded-lg sm:rounded-xl cursor-pointer hover:border-lime hover:bg-zinc-500"
      onClick={() => navigate(`/proposal?id=${proposalNumber}`)}
    >
      <div className="w-full flex justify-between items-center">
        <div className="lg:max-w-[calc(100%-240px)] flex items-start gap-2">
          <div className="flex items-center gap-1">
            <div className="text-base sm:text-xl md:text-2xl font-medium text-zinc-700 whitespace-nowrap">
              {proposalNumber}
            </div>
          </div>
          <div className="text-base sm:text-xl md:text-2xl font-medium text-gray-500">
            {proposalTitle}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            {proposalStatus === "active" &&
              endDate &&
              calculateDateDifference(endDate) && (
                <div className="text-xs sm:text-sm md:text-base text-zinc-800 font-medium">
                  Ends in {calculateDateDifference(endDate)}
                </div>
              )}
            {proposalStatus === "voted" && (
              <div className="text-xs sm:text-sm md:text-base text-zinc-800 font-medium">
                Pending execution
              </div>
            )}
          </div>
          <div className="">
            <ProposalStatusShow proposalStatus={proposalStatus} />
          </div>
        </div>
      </div>
      <div className="flex lg:hidden">
        <div className="pl-2 sm:pl-3 md:pl-4">
          {proposalStatus === "active" &&
            endDate &&
            calculateDateDifference(endDate) && (
              <div className="text-xs sm:text-sm md:text-base text-zinc-800 font-medium">
                Ends in {calculateDateDifference(endDate)}
              </div>
            )}
          {proposalStatus === "voted" && (
            <div className="text-xs sm:text-sm md:text-base text-zinc-800 font-medium">
              Pending execution
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;
