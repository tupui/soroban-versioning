import React from "react";
import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import Pagination from "../../utils/Pagination";
import ProposalCard from "./ProposalCard";
import { projectNameForGovernance } from "utils/store";
import { modifyProposalToView } from "utils/utils";
import type { ProposalView } from "types/proposal";
import { getProposals } from "@service/ReadContractService";
import Loading from "components/utils/Loading";

const ProposalList: React.FC = () => {
  const projectName = useStore(projectNameForGovernance);
  const [currentPage, setCurrentPage] = useState(0);
  const [proposalData, setProposalData] = useState<ProposalView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposalData = async (_page: number) => {
    if (projectName) {
      setIsLoading(true);
      const proposals = await getProposals(projectName, _page);

      const updatedProposalData = proposals.map((proposal) => {
        return modifyProposalToView(proposal, projectName);
      });

      setProposalData(updatedProposalData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProposalData(currentPage);
  }, [currentPage, projectName]);

  return (
    <>
      {isLoading ? (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loading />
        </div>
      ) : (
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
              currentPage={currentPage + 1}
              onPageChange={(page: number) => setCurrentPage(page - 1)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProposalList;
