import React from "react";
import { useState, useEffect } from "react";
import Markdown from "markdown-to-jsx";
import "github-markdown-css";
import type { ProposalOutcome } from "types/proposal";
import { demoOutcomeData } from "constants/demoProposalData";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
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
          <div className="w-full mt-4 sm:mt-5 md:mt-7 min-h-24 sm:min-h-32">
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-5">
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

export const OutcomeDetail: React.FC<{
  type: string;
  detail: { description: string; xdr: string };
}> = ({ type, detail }) => {
  const [content, setContent] = useState<any>(null);

  const getContentFromXdr = async (_xdr: string) => {
    try {
      if (_xdr) {
        setContent(demoOutcomeData);
      }
    } catch (error) {
      console.error("Error decoding XDR:", error);
    }
  };

  useEffect(() => {
    getContentFromXdr(detail.xdr);
  }, [detail]);

  return (
    <div className="flex flex-col gap-1 sm:gap-2 md:gap-3">
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
      <div className="w-full p-2 md:p-4 pr-0 md:pr-0 bg-white">
        <div className="pr-2 md:pr-4 max-h-40 md:max-h-80 overflow-y-auto">
          {content ? (
            <JsonView src={content} theme="vscode" collapsed={2} />
          ) : (
            <div className="text-center text-base md:text-lg">No content</div>
          )}
        </div>
      </div>
    </div>
  );
};
