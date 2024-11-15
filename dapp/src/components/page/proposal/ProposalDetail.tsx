import React from "react";
import Markdown from "markdown-to-jsx";
import "github-markdown-css";
import type { ProposalOutcome } from "types/proposal";

interface ProposalDetailProps {
  description: string;
  outcome: ProposalOutcome | null;
}

const ProposalDetail: React.FC<ProposalDetailProps> = ({
  description,
  outcome,
}) => {
  return (
    <div className="w-full bg-zinc-100 rounded-xl px-4 sm:px-8 md:px-12 py-4 sm:py-7 md:py-10">
      <div className="w-full flex flex-col gap-4 sm:gap-6 md:gap-8">
        <div className="">
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold">
            Proposal Description
          </div>
          <div className="w-full mt-4 sm:mt-5 md:mt-7 min-h-24 sm:min-h-32">
            <div className="markdown-body w-full px-4 sm:px-6 md:px-8 py-6">
              <Markdown>{description}</Markdown>
            </div>
          </div>
        </div>
        <div className="">
          <div className="text-xl sm:text-2xl md:text-3xl font-semibold">
            Proposed Outcome
          </div>
          <div className="w-full mt-4 sm:mt-5 md:mt-7 min-h-24 sm:min-h-32 bg-white">
            <div className="px-1 sm:px-2 md:px-3 py-2 sm:py-3 md:py-4 flex flex-col gap-2 sm:gap-3 md:gap-5">
              {outcome &&
                Object.entries(outcome).map(([key, value]) => (
                  <OutcomeDetail key={key} type={key} detail={value} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;

const OutcomeDetail: React.FC<{
  type: string;
  detail: { description: string; xdr: string };
}> = ({ type, detail }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
      <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2 md:gap-3">
        <div
          className={`text-base sm:text-xl md:text-2xl text-white md:py-0.5 px-1 md:px-2 rounded md:rounded-md 
            ${type === "approved" ? "bg-green" : type === "rejected" ? "bg-conflict" : type === "cancelled" ? "bg-abstain" : "bg-gray-300"}`}
        >
          {type}
        </div>
        <div className="text-sm sm:text-lg md:text-[22px] md:mt-1.5">
          {detail.description}
        </div>
      </div>
      <div className="flex items-start gap-1">
        <div className="w-9 sm:w-11 md:w-16">
          <label className="text-base sm:text-xl md:text-[26px]">XDR:</label>
        </div>
        <div
          className={`w-[calc(100%-68px)] px-1 sm:px-2 rounded border bg-zinc-100 border-zinc-300 text-sm sm:text-base md:text-lg break-words transition-all duration-150 ${
            isExpanded
              ? "h-36 py-0.5 sm:py-1 overflow-y-auto"
              : "h-5 sm:h-[26px] md:h-[30px] sm:py-0.5 overflow-hidden truncate"
          }`}
        >
          {detail.xdr}
        </div>
        <div
          onClick={toggleExpand}
          className="w-5 sm:w-[26px] md:w-[30px] h-5 sm:h-[26px] md:h-[30px] rounded border border-zinc-300"
        >
          {isExpanded ? "^" : "#"}
        </div>
      </div>
    </div>
  );
};
