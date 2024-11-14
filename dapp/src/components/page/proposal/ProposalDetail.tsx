import React from "react";
import Markdown from "markdown-to-jsx";
import "github-markdown-css";

interface ProposalDetailProps {
  description: string;
  outcome: string;
}

const ProposalDetail: React.FC<ProposalDetailProps> = ({
  description,
  outcome,
}) => {
  return (
    <div className="w-full bg-zinc-100 rounded-xl px-4 sm:px-8 md:px-12 py-4 sm:py-7 md:py-10">
      <div className="w-full flex flex-col gap-4 sm:gap-6 md:gap-8">
        <div className="">
          <div className="text-xl sm:text-2xl md:text-[32px] font-semibold">
            Proposal Description
          </div>
          <div className="w-full mt-4 sm:mt-5 md:mt-7 min-h-24 sm:min-h-32">
            <div className="markdown-body w-full px-4 sm:px-6 md:px-8 py-6">
              <Markdown>{description}</Markdown>
            </div>
          </div>
        </div>
        <div className="">
          <div className="text-xl sm:text-2xl md:text-[32px] font-semibold">
            Proposed Outcome
          </div>
          <div className="w-full mt-4 sm:mt-5 md:mt-7 min-h-24 sm:min-h-32">
            <div>{outcome}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;
