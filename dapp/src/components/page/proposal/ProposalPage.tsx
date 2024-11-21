import React from "react";
import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import ProposalPageTitle from "./ProposalPageTitle";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import VotersModal from "./VotersModal";
import VotingModal from "./VotingModal";
import { connectedPublicKey, proposalId } from "utils/store";
import type {
  VoteType,
  Proposal,
} from "types/proposal";
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
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState<ProposalOutcome | null>(null);
  const [voteType, setVoteType] = useState<VoteType>();

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
    if (proposal?.status === "voted") {
      setIsExecuteProposalModalOpen(true);
    } else {
      alert("Cannot execute proposal.");
    }
  };
  const getProposalDetails = async () => {
    const proposal = demoProposalData[id - 1];
    if (proposal) {
      setProposal(proposal);
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
        id={proposal?.id.toString() || ""}
        title={proposal?.title || ""}
        submitVote={() => openVotingModal()}
        executeProposal={() => openExecuteProposalModal()}
        status={proposal?.status || null}
        maintainers={proposal?.maintainers || []}
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
          NQGScore={proposal?.voteStatus?.nqgScore || 0}
          voteData={(voteType && proposal?.voteStatus?.[voteType]) || null}
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
