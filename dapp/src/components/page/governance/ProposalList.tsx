import React from "react";
import { useState, useEffect } from "react";
import Pagination from "../../utils/Pagination";
import { demoProposalData } from "constants/demoProposalData";
import ProposalCard from "./ProposalCard";
import { projectNameForGovernance } from "utils/store";
import { useStore } from "@nanostores/react";
import type { ProposalView, ProposalViewStatus } from "types/proposal";

const ProposalList: React.FC = () => {
  const projectName = useStore(projectNameForGovernance);
  const [currentPage, setCurrentPage] = useState(1);
  const [proposalData, setProposalData] = useState<ProposalView[]>([]);

  const fetchProposalData = async (_page: number) => {
    const updatedProposalData = demoProposalData.map((proposal) => {
      let proposalStatusView;

      if (proposal.status === "accepted") {
        proposalStatusView = "approved";
      } else if (proposal.status === "active") {
        if (proposal.endDate !== null) {
          const endDateTimestamp = new Date(proposal.endDate).setHours(
            0,
            0,
            0,
            0,
          );
          const currentTime = new Date().setHours(0, 0, 0, 0);
          if (endDateTimestamp < currentTime) {
            proposalStatusView = "voted";
          } else {
            proposalStatusView = "active";
          }
        }
      } else {
        proposalStatusView = proposal.status;
      }

      return { ...proposal, status: proposalStatusView as ProposalViewStatus };
    });

    setProposalData(updatedProposalData);
  };

  useEffect(() => {
    fetchProposalData(currentPage);
  }, [currentPage, projectName]);

  return (
    <div className="w-full py-4 sm:py-8 md:py-12 px-3 sm:px-9 md:px-13 bg-zinc-200 rounded-xl sm:rounded-3xl rounded-tl-none sm:rounded-tl-none">
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-5">
        {proposalData.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposalNumber={proposal.id}
            proposalTitle={proposal.title}
            proposalStatus={proposal.status}
            endDate={proposal.endDate}
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
