import React from "react";
import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import ProposalPageTitle from "./ProposalPageTitle";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import VotersModal from "./VotersModal";
import VotingModal from "./VotingModal";
import { connectedPublicKey, proposalId } from "utils/store";
import type { VoteType, VoteStatus, ProposalStatus } from "types/proposal";
import { demoProposalData } from "constants/demoProposalData";
import ProposalDetail from "./ProposalDetail";
import {
  fetchOutcomeDataFromIPFS,
  fetchProposalFromIPFS,
} from "@service/ProposalService";
import type { ProposalOutcome } from "types/proposal";
import ExecuteProposalModal from "./ExecuteProposalModal";

const ProposalPage: React.FC = () => {
  const id = useStore(proposalId);
  const connectedAddress = useStore(connectedPublicKey);
  const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const [isExecuteProposalModalOpen, setIsExecuteProposalModalOpen] =
    useState(false);
  const [maintainers, setMaintainers] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState<ProposalOutcome | null>(null);
  const [voteType, setVoteType] = useState<VoteType>();
  const [voteStatus, setVoteStatus] = useState<VoteStatus>();
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | null>(
    null,
  );
  const [endDate, setEndDate] = useState<string | null>(null);

  const openVotersModal = (voteType: VoteType) => {
    if (proposalStatus !== "active") {
      setVoteType(voteType);
      setIsVotersModalOpen(true);
    } else {
      alert("Cannot show voters while voting is in progress");
    }
  };

  const openVotingModal = () => {
    if (proposalStatus === "active") {
      if (connectedAddress) {
        setIsVotingModalOpen(true);
      } else {
        alert("Please connect your wallet first");
      }
    } else {
      alert("Cannot vote anymore, voting is ended.");
    }
  };

  const openExecuteProposalModal = () => {
    if (proposalStatus === "voted") {
      setIsExecuteProposalModalOpen(true);
    } else {
      alert("Cannot execute proposal.");
    }
  };

  const getProposalDetails = async () => {
    const proposal = demoProposalData[0];
    if (proposal) {
      setMaintainers(proposal.maintainers);
      setVoteStatus(proposal.voteStatus);
      setProposalStatus(proposal.status);
      setEndDate(proposal.endDate);
      const description = await fetchProposalFromIPFS(proposal.ipfsLink);
      setDescription(description);
      const outcome = await fetchOutcomeDataFromIPFS(proposal.ipfsLink);
      setOutcome(outcome);
    } else {
      alert("Proposal not found");
    }
  };

  useEffect(() => {
    getProposalDetails();
  }, [id]);

  return (
    <div>
      <ProposalPageTitle
        id={id}
        title="Bounty of issue: integrate DAO system to Tansu"
        submitVote={() => openVotingModal()}
        executeProposal={() => openExecuteProposalModal()}
        status={proposalStatus}
        maintainers={maintainers}
      />
      <div className="flex flex-col gap-3 sm:gap-5 md:gap-7">
        <ProposalStatusSection status={proposalStatus} endDate={endDate} />
        <VoteStatusBar
          approve={50}
          reject={30}
          abstain={20}
          onClick={(voteType) => openVotersModal(voteType)}
        />
        <ProposalDetail
          description={description}
          outcome={outcome}
          status={proposalStatus}
        />
      </div>
      {isVotersModalOpen && voteStatus && (
        <VotersModal
          NQGScore={4.5}
          voteData={voteType ? voteStatus[voteType] : null}
          onClose={() => setIsVotersModalOpen(false)}
        />
      )}
      {isVotingModalOpen && (
        <VotingModal onClose={() => setIsVotingModalOpen(false)} />
      )}
      {isExecuteProposalModalOpen && (
        <ExecuteProposalModal
          xdr={outcome?.approved.xdr ?? ""}
          onClose={() => setIsExecuteProposalModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProposalPage;
