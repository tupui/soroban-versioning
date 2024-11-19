import React from "react";
import { useState, useEffect } from "react";
import Markdown from "markdown-to-jsx";
import "github-markdown-css";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import { processDecodedData } from "utils/utils";
import { demoOutcomeData } from "constants/demoProposalData";
import { stellarLabViewXdrLink } from "constants/serviceLinks";
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
          <div className="w-full bg-white mt-4 sm:mt-5 md:mt-7 px-3 sm:px-5 md:px-6 py-4 sm:py-7 md:py-9 min-h-24 sm:min-h-32">
            <div className="flex flex-col gap-3 sm:gap-5 md:gap-8">
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
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleHeight = () => {
    setIsExpanded(!isExpanded);
  };

  const modifySlashInXdr = (xdr: string) => {
    return xdr.replaceAll("/", "//");
  };

  const getContentFromXdr = async (_xdr: string) => {
    try {
      if (_xdr) {
        const decoded = processDecodedData(_xdr);
        console.log("decode:", decoded);
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
    <div className="flex flex-col gap-1 sm:gap-4 md:gap-6">
      <div className="flex flex-col md:flex-row items-start gap-1 sm:gap-2 md:gap-3">
        <div
          className={`text-base sm:text-xl md:text-2xl text-white md:py-0.5 px-1 md:px-2 rounded md:rounded-md 
            ${type === "approved" ? "bg-approved" : type === "rejected" ? "bg-conflict" : type === "cancelled" ? "bg-abstain" : type === "voted" ? "bg-voted" : "bg-gray-300"}`}
        >
          {type}
        </div>
        <div className="text-sm sm:text-lg md:text-xl md:mt-1.5">
          {detail.description}
        </div>
      </div>
      <div className="">
        {content ? (
          <div className="flex flex-col gap-1 sm:gap-2 md:gap-3">
            <a
              href={`${stellarLabViewXdrLink}${modifySlashInXdr(detail.xdr)};;`}
              target="_blank"
              rel="noreferrer"
              className="flex gap-0.5 sm:gap-1 text-black hover:text-blue"
            >
              <img
                src="/icons/logos/stellar-xlm.svg"
                alt="Stellar"
                className="w-4 sm:w-[20px] h-4 sm:h-[20px]"
              />
              <span className="text-xs sm:text-sm md:text-base">
                View in Stellar Lab
              </span>
            </a>
            <div
              className={`transition-all duration-300 ${isExpanded ? "max-h-max" : "max-h-24"} overflow-hidden flex flex-col bg-zinc-100 border border-zinc-400 rounded-xl`}
            >
              <div className="w-full py-1 sm:py-2 px-2 sm:px-3 md:px-5">
                <div
                  onClick={toggleHeight}
                  className="w-fit flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-300 cursor-pointer"
                >
                  <span className="text-sm sm:text-base md:text-lg">XDR</span>
                  <img
                    src="/icons/arrow-up.svg"
                    alt="Arrow up"
                    className={`${isExpanded ? "block" : "hidden"}`}
                  />
                  <img
                    src="/icons/arrow-down.svg"
                    alt="Arrow down"
                    className={`${isExpanded ? "hidden" : "block"}`}
                  />
                </div>
              </div>
              <div className="w-full border-b border-zinc-400"></div>
              <div className="jsonview-body w-full px-1 sm:px-3 md:px-5 py-2 sm:py-3 md:py-4">
                <div className={`${isExpanded ? "block" : "hidden"} w-full`}>
                  <div className="pr-2 md:pr-4 max-h-40 md:max-h-96 overflow-y-auto">
                    <JsonView src={content} theme="vscode" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-base md:text-lg px-1 sm:px-2 md:px-4 py-1 md:py-3 bg-zinc-100 border border-zinc-400 rounded-xl">
            No transaction to execute
          </div>
        )}
      </div>
    </div>
  );
};
