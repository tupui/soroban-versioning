import { useStore } from "@nanostores/react";
import React from "react";
import { useState, useEffect } from "react";
import { connectedPublicKey } from "utils/store";
import type { ProposalStatus } from "types/proposal";
interface Props {
  id: string;
  title: string;
  maintainers: string[];
  submitVote: () => void;
  status: ProposalStatus | null;
}

const ProposalPageTitle: React.FC<Props> = ({
  id,
  title,
  maintainers,
  submitVote,
  status,
}) => {
  const [projectId, setProjectId] = useState(id);
  const connectedAddress = useStore(connectedPublicKey);

  useEffect(() => {
    if (id) {
      setProjectId(id);
    }
  }, [id]);

  return (
    <div className="relative flex flex-col items-center md:flex-row justify-between mb-1.5 mt-4 sm:mt-8 md:mt-12 gap-y-4">
      <div className="grid place-items-center gap-8 md:flex">
        <span className="w-14 sm:w-16 md:w-20 flex justify-center text-2xl sm:text-3xl md:text-4xl px-1 font-medium bg-lime rounded-md sm:rounded-lg">
          {projectId}
        </span>
        <p className="text-2xl sm:text-3xl lg:text-[34px] font-normal text-center md:text-start">
          {title}
        </p>
      </div>
      <div className="flex">
        <div
          id="vote-proposal-button"
          className={`${status !== "active" ? "hidden" : "block"}`}
        >
          <button
            disabled={status !== "active"}
            onClick={() => submitVote()}
            className={`w-full px-3 md:px-4 py-1 sm:py-1.5 md:py-3 ${!connectedAddress ? "bg-zinc-600" : "bg-zinc-900"} rounded-lg sm:rounded-xl md:rounded-[14px] justify-center gap-2.5 inline-flex`}
          >
            <span className="text-center text-white text-base sm:text-lg md:text-xl font-normal">
              Vote
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalPageTitle;
