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
      const response = await getProposal(projectName, id);
      const proposal = response.data;
      const res = await getProjectFromName(projectName);
      const projectInfo = res.data;
      if (projectInfo && projectInfo.maintainers) {
        setProjectMaintainers(projectInfo?.maintainers);
      } else if (res.error) {
        toast.error("Something Went Wrong!", res.errorMessage);
      }
      if (proposal) {
        const proposalView = modifyProposalToView(proposal, projectName);
        setProposal(proposalView);
        const description = await fetchProposalFromIPFS(proposal.ipfs);
        setDescription(description);
        const outcome = await fetchOutcomeDataFromIPFS(proposal.ipfs);
        setOutcome(outcome);
      } else if (response.error) {
        toast.error("Something Went Wrong!", response.errorMessage);
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
        <div className="bg-[#FFFFFFB8] px-[72px] py-12 flex flex-col gap-12">
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
