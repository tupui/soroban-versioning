import { getProposalPages, getProposals } from "@service/ReadContractService";
import Loading from "components/utils/Loading";
import React, { useEffect, useState } from "react";
import type { ProposalView } from "types/proposal";
import { modifyProposalToView, toast } from "utils/utils";
import Pagination from "../../utils/Pagination";
import VotingModal from "../proposal/VotingModal";
import ProposalCard from "./ProposalCard";

const ProposalList: React.FC = () => {
  const projectName =
    new URLSearchParams(window.location.search).get("name") || "";
  const [totalPage, setTotalPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [proposalData, setProposalData] = useState<ProposalView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [proposalId, setProposalId] = useState<number>();
  const [proposalTitle, setProposalTitle] = useState<string>();

  const fetchProposalPages = async () => {
    try {
      if (projectName) {
        const page = await getProposalPages(projectName);
        setTotalPage(page ?? 0);
      }
    } catch (err: any) {
      toast.error("Proposal list", err.message);
    }
  };

  const fetchProposalData = async (_page: number) => {
    if (projectName) {
      setIsLoading(true);
      try {
        const proposals = (await getProposals(projectName, _page)) || [];
        const updatedProposalData = proposals
          .map((proposal) => {
            return modifyProposalToView(proposal, projectName);
          })
          .sort((a, b) => b.id - a.id);
        setProposalData(updatedProposalData);
      } catch (error: any) {
        toast.error("Something Went Wrong!", error.message);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposalPages();
  }, [projectName]);

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
                proposal={proposal}
                onVoteClick={() => {
                  setProposalId(proposal.id);
                  setProposalTitle(proposal.title);
                  setShowVotingModal(true);
                }}
              />
            ))}
          </div>
          <Pagination
            totalPage={totalPage}
            currentPage={currentPage + 1}
            onPageChange={(page: number) => setCurrentPage(page - 1)}
          />
        </div>
      )}
      {showVotingModal && (
        <VotingModal
          projectName={projectName}
          proposalId={proposalId}
          proposalTitle={proposalTitle}
          onClose={() => setShowVotingModal(false)}
        />
      )}
    </>
  );
};

export default ProposalList;
