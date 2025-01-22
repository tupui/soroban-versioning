import React from "react";
import { useState, useEffect } from "react";
import * as StellarXdr from "utils/stellarXdr";
import Markdown from "markdown-to-jsx";
import "github-markdown-css";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import {
  capitalizeFirstLetter,
  modifySlashInXdr,
  getProposalLinkFromIpfs,
  getOutcomeLinkFromIpfs,
} from "utils/utils";
import { stellarLabViewXdrLink } from "constants/serviceLinks";
import type { ProposalOutcome, ProposalViewStatus } from "types/proposal";
import { parseToLosslessJson } from "utils/passToLosslessJson";
interface ProposalDetailProps {
  ipfsLink: string | null;
  description: string;
  outcome: ProposalOutcome | null;
  status: ProposalViewStatus | null;
}

const ProposalDetail: React.FC<ProposalDetailProps> = ({
  ipfsLink,
  description,
  outcome,
  status,
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await StellarXdr.initialize();
      setIsReady(true);
    };

    init();
  }, []);

  return (
    <div className="w-full bg-zinc-100 rounded-xl px-4 sm:px-8 md:px-12 py-4 sm:py-7 md:py-10">
      <div className="w-full flex flex-col gap-4 sm:gap-6 md:gap-8">
        <div className="">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            <div className="text-xl sm:text-2xl md:text-3xl font-medium">
              Proposal Description
            </div>
            <a
              href={(ipfsLink && getProposalLinkFromIpfs(ipfsLink)) || ""}
              target="_blank"
              rel="noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                id="Layer_1"
                x="0px"
                y="0px"
                className="w-4 sm:w-6 h-4 sm:h-6 fill-black hover:fill-blue"
                viewBox="0 0 512 512"
                enableBackground="new 0 0 512 512"
              >
                <path d="M459.654,233.373l-90.531,90.5c-49.969,50-131.031,50-181,0c-7.875-7.844-14.031-16.688-19.438-25.813  l42.063-42.063c2-2.016,4.469-3.172,6.828-4.531c2.906,9.938,7.984,19.344,15.797,27.156c24.953,24.969,65.563,24.938,90.5,0  l90.5-90.5c24.969-24.969,24.969-65.563,0-90.516c-24.938-24.953-65.531-24.953-90.5,0l-32.188,32.219  c-26.109-10.172-54.25-12.906-81.641-8.891l68.578-68.578c50-49.984,131.031-49.984,181.031,0  C509.623,102.342,509.623,183.389,459.654,233.373z M220.326,382.186l-32.203,32.219c-24.953,24.938-65.563,24.938-90.516,0  c-24.953-24.969-24.953-65.563,0-90.531l90.516-90.5c24.969-24.969,65.547-24.969,90.5,0c7.797,7.797,12.875,17.203,15.813,27.125  c2.375-1.375,4.813-2.5,6.813-4.5l42.063-42.047c-5.375-9.156-11.563-17.969-19.438-25.828c-49.969-49.984-131.031-49.984-181.016,0  l-90.5,90.5c-49.984,50-49.984,131.031,0,181.031c49.984,49.969,131.031,49.969,181.016,0l68.594-68.594  C274.561,395.092,246.42,392.342,220.326,382.186z" />
              </svg>
            </a>
          </div>
          <div className="w-full mt-4 sm:mt-5 md:mt-7 min-h-24 sm:min-h-32">
            <div className="markdown-body w-full px-4 sm:px-6 md:px-8 py-6">
              <Markdown>{description}</Markdown>
            </div>
          </div>
        </div>
        <div className="">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            <div className="text-xl sm:text-2xl md:text-3xl font-medium">
              Proposal Outcome
            </div>
            <a
              href={(ipfsLink && getOutcomeLinkFromIpfs(ipfsLink)) || ""}
              target="_blank"
              rel="noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                id="Layer_1"
                x="0px"
                y="0px"
                className="w-4 sm:w-6 h-4 sm:h-6 fill-black hover:fill-blue"
                viewBox="0 0 512 512"
                enableBackground="new 0 0 512 512"
              >
                <path d="M459.654,233.373l-90.531,90.5c-49.969,50-131.031,50-181,0c-7.875-7.844-14.031-16.688-19.438-25.813  l42.063-42.063c2-2.016,4.469-3.172,6.828-4.531c2.906,9.938,7.984,19.344,15.797,27.156c24.953,24.969,65.563,24.938,90.5,0  l90.5-90.5c24.969-24.969,24.969-65.563,0-90.516c-24.938-24.953-65.531-24.953-90.5,0l-32.188,32.219  c-26.109-10.172-54.25-12.906-81.641-8.891l68.578-68.578c50-49.984,131.031-49.984,181.031,0  C509.623,102.342,509.623,183.389,459.654,233.373z M220.326,382.186l-32.203,32.219c-24.953,24.938-65.563,24.938-90.516,0  c-24.953-24.969-24.953-65.563,0-90.531l90.516-90.5c24.969-24.969,65.547-24.969,90.5,0c7.797,7.797,12.875,17.203,15.813,27.125  c2.375-1.375,4.813-2.5,6.813-4.5l42.063-42.047c-5.375-9.156-11.563-17.969-19.438-25.828c-49.969-49.984-131.031-49.984-181.016,0  l-90.5,90.5c-49.984,50-49.984,131.031,0,181.031c49.984,49.969,131.031,49.969,181.016,0l68.594-68.594  C274.561,395.092,246.42,392.342,220.326,382.186z" />
              </svg>
            </a>
          </div>
          <div className="w-full bg-white mt-4 sm:mt-5 md:mt-7 px-3 sm:px-5 md:px-6 py-4 sm:py-7 md:py-9 min-h-24 sm:min-h-32">
            <div className="flex flex-col gap-3 sm:gap-5 md:gap-8">
              {outcome &&
                Object.entries(outcome).map(([key, value]) => (
                  <OutcomeDetail
                    key={key}
                    type={key}
                    detail={value}
                    proposalStatus={status}
                    isXdrInit={isReady}
                  />
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
  proposalStatus: ProposalViewStatus | null;
  isXdrInit: boolean;
}> = ({ type, detail, proposalStatus, isXdrInit }) => {
  const [content, setContent] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleHeight = () => {
    setIsExpanded(!isExpanded);
  };

  const getContentFromXdr = async (_xdr: string) => {
    try {
      if (!isXdrInit) {
        return;
      }

      if (_xdr) {
        const decoded = StellarXdr.decode("TransactionEnvelope", _xdr);
        setContent(parseToLosslessJson(decoded));
      }
    } catch (error) {
      console.error("Error decoding XDR:", error);
    }
  };

  useEffect(() => {
    getContentFromXdr(detail.xdr);
  }, [detail, isXdrInit]);

  return (
    <div className="flex flex-col gap-1 sm:gap-4 md:gap-6">
      <div className="flex flex-col items-start gap-1 sm:gap-2 md:gap-3">
        <div
          className={`text-base sm:text-xl md:text-2xl text-white md:py-0.5 px-1 md:px-2 rounded md:rounded-md 
            ${type === "approved" ? "bg-approved" : type === "rejected" ? "bg-conflict" : type === "cancelled" ? "bg-abstain" : type === "voted" ? "bg-voted" : "bg-gray-300"}
            ${type === proposalStatus || (type === "approved" && proposalStatus === "voted") ? "shadow-vote" : `${proposalStatus !== "active" && !(type === "approved" && proposalStatus === "voted") && "bg-zinc-700"}`}`}
        >
          {capitalizeFirstLetter(type)}
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
              className="flex items-center gap-0.5 sm:gap-1 text-black hover:text-blue  group"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                id="Stellar--Streamline-Simple-Icons.svg"
                height="24"
                width="24"
                fill="#000000"
                className="group-hover:fill-blue w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
              >
                <desc>Stellar Streamline Icon: https://streamlinehq.com</desc>
                <title>Stellar</title>
                <path
                  d="M12.283 1.851A10.154 10.154 0 0 0 1.846 12.002c0 0.259 0.01 0.516 0.03 0.773A1.847 1.847 0 0 1 0.872 14.56L0 15.005v2.074l2.568 -1.309 0.832 -0.424 0.82 -0.417 14.71 -7.496 1.653 -0.842L24 4.85V2.776l-3.387 1.728 -2.89 1.473 -13.955 7.108a8.376 8.376 0 0 1 -0.07 -1.086 8.313 8.313 0 0 1 12.366 -7.247l1.654 -0.843 0.247 -0.126a10.154 10.154 0 0 0 -5.682 -1.932zM24 6.925 5.055 16.571l-1.653 0.844L0 19.15v2.072L3.378 19.5l2.89 -1.473 13.97 -7.117a8.474 8.474 0 0 1 0.07 1.092A8.313 8.313 0 0 1 7.93 19.248l-0.101 0.054 -1.793 0.914a10.154 10.154 0 0 0 16.119 -8.214c0 -0.26 -0.01 -0.522 -0.03 -0.78a1.848 1.848 0 0 1 1.003 -1.785L24 8.992Z"
                  strokeWidth="1"
                ></path>
              </svg>
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
