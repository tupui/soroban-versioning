import { useStore } from "@nanostores/react";
import { getProposals } from "@service/ReadContractService";
import Loading from "components/utils/Loading";
import React, { useEffect, useState } from "react";
import type { ProposalView } from "types/proposal";
import { projectNameForGovernance } from "utils/store";
import { modifyProposalToView } from "utils/utils";
import Pagination from "../../utils/Pagination";
import ProposalCard from "./ProposalCard";

const ProposalList: React.FC = () => {
  const projectName = useStore(projectNameForGovernance);
  const [currentPage, setCurrentPage] = useState(0);
  const [proposalData, setProposalData] = useState<ProposalView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposalData = async (_page: number) => {
    if (projectName) {
      setIsLoading(true);
      const res = await getProposals(projectName, _page);
      const proposals = res.data;

      if (proposals && !res.error) {
        const updatedProposalData = proposals.map((proposal) => {
          return modifyProposalToView(proposal, projectName);
        });
        setProposalData(updatedProposalData);
      } else {
        alert(res.errorMessage);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProposalData(currentPage);
  }, [currentPage, projectName]);

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="w-full">
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
