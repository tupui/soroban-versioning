import React from "react";
import { useState, useEffect } from "react";
import Pagination from "../../utils/Pagination";
import { demoProposalCardData } from "constants/demoProposalData";
import ProposalCard from "./ProposalCard";
import { projectNameForGovernance } from "utils/store";
import { useStore } from "@nanostores/react";
import type { ProposalCardProps } from "types/proposal";

const ProposalList: React.FC = () => {
  const projectName = useStore(projectNameForGovernance);
  const [currentPage, setCurrentPage] = useState(1);
  const [proposalCardData, setProposalCardData] = useState<ProposalCardProps[]>(
    [],
  );

  const fetchProposalCardData = async (page: number) => {
    setProposalCardData(demoProposalCardData);
  };

  useEffect(() => {
    fetchProposalCardData(currentPage);
  }, [currentPage, projectName]);

  return (
    <div className="w-full py-4 sm:py-8 md:py-12 px-3 sm:px-9 md:px-13 bg-zinc-200 rounded-xl sm:rounded-3xl rounded-tl-none sm:rounded-tl-none">
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-5">
        {proposalCardData.map((proposal) => (
          <ProposalCard
            key={proposal.proposalNumber}
            proposalNumber={proposal.proposalNumber}
            proposalTitle={proposal.proposalTitle}
            proposalStatus={proposal.proposalStatus}
            endDate={proposal.endDate}
            expiredDate={proposal.expiredDate}
          />
        ))}
      </div>
      <div>
        <Pagination
          currentPage={currentPage}
          onPageChange={(page: number) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default ProposalList;
