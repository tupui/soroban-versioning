import { useStore } from "@nanostores/react";
import {
  fetchOutcomeDataFromIPFS,
  fetchProposalFromIPFS,
} from "@service/ProposalService";
import { getProjectFromName, getProposal } from "@service/ReadContractService";
import Loading from "components/utils/Loading";
import React, { useEffect, useState } from "react";
import type { ProposalOutcome, ProposalView } from "types/proposal";
import { connectedPublicKey } from "utils/store";
import { modifyProposalToView, toast } from "utils/utils";
import ExecuteProposalModal from "./ExecuteProposalModal";
import ProposalDetail from "./ProposalDetail";
import ProposalTitle from "./ProposalTitle";
import VotingModal from "./VotingModal";

const ProposalPage: React.FC = () => {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const projectName =
    new URLSearchParams(window.location.search).get("name") || "";
  const connectedAddress = useStore(connectedPublicKey);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isExecuteProposalModalOpen, setIsExecuteProposalModalOpen] =
    useState(false);
  const [proposal, setProposal] = useState<ProposalView | null>(null);
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState<ProposalOutcome | null>(null);
  const [projectMaintainers, setProjectMaintainers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoted, setIsVoted] = useState(false);

  const openVotingModal = () => {
    if (proposal?.status === "active") {
      if (connectedAddress) {
        setIsVotingModalOpen(true);
      } else {
        toast.error("Connect Wallet", "Please connect your wallet first.");
      }
    }
  };

  const openExecuteProposalModal = () => {
    if (proposal?.status === "voted") {
      setIsExecuteProposalModalOpen(true);
    } else {
      toast.error("Execute Proposal", "Cannot execute proposal.");
    }
  };

  const getProposalDetails = async () => {
    if (!id !== undefined && projectName) {
      setIsLoading(true);
      try {
        const proposal = await getProposal(projectName, id);
        const proposalView = modifyProposalToView(proposal, projectName);
        setProposal(proposalView);
        const description = await fetchProposalFromIPFS(proposal.ipfs);
        setDescription(description);
        const outcome = await fetchOutcomeDataFromIPFS(proposal.ipfs);
        setOutcome(outcome);
      } catch (error: any) {
        console.error("Error fetching proposal details:", error);
        toast.error("Something Went Wrong!", error.message);
      }
      try {
        const projectInfo = await getProjectFromName(projectName);
        if (projectInfo && projectInfo.maintainers) {
          setProjectMaintainers(projectInfo?.maintainers);
        }
      } catch (error: any) {
        toast.error("Something Went Wrong!", error.message);
      }
      setIsLoading(false);
    } else {
      toast.error(
        "Something Went Wrong!",
        "Project name or proposal id is not provided",
      );
    }
  };

  useEffect(() => {
    getProposalDetails();
  }, [id, projectName, isVoted]);

  return (
    <>
      {isLoading ? (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loading />
        </div>
      ) : (
        <div className="bg-[#FFFFFFB8] px-4 sm:px-6 md:px-[72px] py-6 sm:py-8 md:py-12 flex flex-col gap-6 sm:gap-8 md:gap-12">
          <ProposalTitle
            proposal={proposal}
            maintainers={projectMaintainers}
            submitVote={() => openVotingModal()}
            executeProposal={() => openExecuteProposalModal()}
          />
          <ProposalDetail
            ipfsLink={proposal?.ipfsLink || null}
            description={description}
            outcome={outcome}
          />
          {isVotingModalOpen && (
            <VotingModal
              projectName={projectName}
              proposalId={id}
              proposalTitle={proposal?.title}
              isVoted={isVoted}
              setIsVoted={setIsVoted}
              onClose={() => setIsVotingModalOpen(false)}
            />
          )}
          {isExecuteProposalModalOpen && (
            <ExecuteProposalModal
              projectName={projectName}
              proposalId={id}
              outcome={outcome}
              voteStatus={proposal?.voteStatus}
              onClose={() => setIsExecuteProposalModalOpen(false)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ProposalPage;
