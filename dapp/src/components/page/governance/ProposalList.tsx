import { useStore } from "@nanostores/react";
import { getProposals } from "@service/ReadContractService";
import Loading from "components/utils/Loading";
import React, { useEffect, useState } from "react";
import type { ProposalView } from "types/proposal";
import { projectNameForGovernance } from "utils/store";
import { modifyProposalToView } from "utils/utils";
import Pagination from "../../utils/Pagination";
import ProposalCard from "./ProposalCard";
import VotingModal from "../proposal/VotingModal";

const ProposalList: React.FC = () => {
  const projectName = useStore(projectNameForGovernance);
  const [currentPage, setCurrentPage] = useState(0);
  const [proposalData, setProposalData] = useState<ProposalView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [proposalId, setProposalId] = useState<number>();

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
        <div className="w-full flex flex-col gap-12">
          <div className="flex flex-col gap-[18px]">
            {proposalData.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposalNumber={proposal.id}
                proposalTitle={proposal.title}
                proposalStatus={proposal.status}
                endDate={proposal.endDate}
                onVoteClick={() => {
                  setProposalId(proposal.id);
                  setShowVotingModal(true);
                }}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage + 1}
            onPageChange={(page: number) => setCurrentPage(page - 1)}
          />
        </div>
      )}
      {showVotingModal && (
        <VotingModal
          projectName={projectName}
          proposalId={proposalId}
          onClose={() => setShowVotingModal(false)}
        />
      )}
    </>
  );
};

export default ProposalList;
