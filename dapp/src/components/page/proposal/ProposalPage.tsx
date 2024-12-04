import React from "react";
import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import ProposalPageTitle from "./ProposalPageTitle";
import ProposalDetail from "./ProposalDetail";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import VotersModal from "./VotersModal";
import VotingModal from "./VotingModal";
import ExecuteProposalModal from "./ExecuteProposalModal";
import { modifyProposalToView } from "utils/utils";
import {
  connectedPublicKey,
  projectNameForGovernance,
  proposalId,
} from "utils/store";
import {
  fetchOutcomeDataFromIPFS,
  fetchProposalFromIPFS,
} from "@service/ProposalService";
import { getProjectFromName, getProposal } from "@service/ReadContractService";
import type { ProposalOutcome, ProposalView, VoteType } from "types/proposal";
import Loading from "components/utils/Loading";

const ProposalPage: React.FC = () => {
  const id = useStore(proposalId);
  const projectName = useStore(projectNameForGovernance);
  const connectedAddress = useStore(connectedPublicKey);
  const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isExecuteProposalModalOpen, setIsExecuteProposalModalOpen] =
    useState(false);
  const [proposal, setProposal] = useState<ProposalView | null>(null);
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState<ProposalOutcome | null>(null);
  const [voteType, setVoteType] = useState<VoteType>();
  const [projectMaintainers, setProjectMaintainers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoted, setIsVoted] = useState(false);

  const openVotersModal = (voteType: VoteType) => {
    if (proposal?.status !== "active") {
      setVoteType(voteType);
      setIsVotersModalOpen(true);
    } else {
      alert("Cannot show voters while voting is in progress");
    }
  };

  const openVotingModal = () => {
    if (proposal?.status === "active") {
      if (connectedAddress) {
        setIsVotingModalOpen(true);
      } else {
        alert("Please connect your wallet first");
      }
    }
  };

  const openExecuteProposalModal = () => {
    if (proposal?.status === "active") {
      setIsExecuteProposalModalOpen(true);
    } else {
      alert("Cannot execute proposal.");
    }
  };
  const getProposalDetails = async () => {
    if (id !== undefined && projectName) {
      setIsLoading(true);
      const response = await getProposal(projectName, id);
      const proposal = response.data;
      const res = await getProjectFromName(projectName);
      const projectInfo = res.data;
      if (projectInfo && projectInfo.maintainers) {
        setProjectMaintainers(projectInfo?.maintainers);
      } else if (res.error) {
        alert(res.errorMessage);
      }
      if (proposal) {
        const proposalView = modifyProposalToView(proposal, projectName);
        setProposal(proposalView);
        const description = await fetchProposalFromIPFS(proposal.ipfs);
        setDescription(description);
        const outcome = await fetchOutcomeDataFromIPFS(proposal.ipfs);
        setOutcome(outcome);
      } else if (response.error) {
        alert(response.errorMessage);
      }
      setIsLoading(false);
    } else {
      alert("Project name or proposal id is not provided");
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
        <>
          <ProposalPageTitle
            id={proposal?.id.toString() || ""}
            title={proposal?.title || ""}
            submitVote={() => openVotingModal()}
            executeProposal={() => openExecuteProposalModal()}
            status={proposal?.status || null}
            maintainers={projectMaintainers}
          />
          <div className="flex flex-col gap-3 sm:gap-5 md:gap-7">
            <ProposalStatusSection
              status={proposal?.status || null}
              endDate={proposal?.endDate || null}
            />
            <VoteStatusBar
              approve={proposal?.voteStatus?.approve?.score || 0}
              reject={proposal?.voteStatus?.reject?.score || 0}
              abstain={proposal?.voteStatus?.abstain?.score || 0}
              onClick={(voteType) => openVotersModal(voteType)}
            />
            <ProposalDetail
              ipfsLink={proposal?.ipfsLink || null}
              description={description}
              outcome={outcome}
              status={proposal?.status || null}
            />
          </div>
          {isVotersModalOpen && proposal?.voteStatus && (
            <VotersModal
              NQGScore={proposal?.nqg || 0}
              voteData={(voteType && proposal?.voteStatus?.[voteType]) || null}
              projectMaintainers={projectMaintainers}
              onClose={() => setIsVotersModalOpen(false)}
            />
          )}
          {isVotingModalOpen && (
            <VotingModal
              projectName={projectName}
              proposalId={id}
              isVoted={isVoted}
              setIsVoted={setIsVoted}
              onClose={() => setIsVotingModalOpen(false)}
            />
          )}
          {isExecuteProposalModalOpen && (
            <ExecuteProposalModal
              xdr={outcome?.approved.xdr ?? ""}
              onClose={() => setIsExecuteProposalModalOpen(false)}
            />
          )}
        </>
      )}
    </>
  );
};

export default ProposalPage;
