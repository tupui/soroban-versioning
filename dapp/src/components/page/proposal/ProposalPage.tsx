import React from "react";
import { useState, useEffect } from "react";
import ProposalPageTitle from "./ProposalPageTitle";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import VotersModal from "./VotersModal";
import { useStore } from "@nanostores/react";
import { proposalId } from "utils/store";
import type { VoteType, VoteStatus } from "types/proposal";
import { demoProposalData } from "constants/demoProposalData";
import ProposalDetail from "./ProposalDetail";
import { fetchProposalFromIPFS } from "@service/ProposalService";

const ProposalPage: React.FC = () => {
  const id = useStore(proposalId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [voteType, setVoteType] = useState<VoteType>();
  const [voteStatus, setVoteStatus] = useState<VoteStatus>();

  const openVotersModal = (voteType: VoteType) => {
    setVoteType(voteType);
    setIsModalOpen(true);
  };

  const getProposalDetails = async () => {
    const proposal = demoProposalData[0];
    if (proposal) {
      setVoteStatus(proposal.voteStatus);
      const description = await fetchProposalFromIPFS(proposal.ipfsLink);
      console.log("description:", description);
      setDescription(description);
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
        title="Bounty of issue: integrate DAO system to Tansu - $3000"
        submitVote={() => {}}
      />
      <div className="flex flex-col gap-3 sm:gap-5 md:gap-7">
        <ProposalStatusSection status="active" endDate={"2024-11-24"} />
        <VoteStatusBar
          interest={50}
          conflict={30}
          abstain={20}
          onClick={(voteType) => openVotersModal(voteType)}
        />
        <ProposalDetail description={description} outcome="" />
      </div>
      {isModalOpen && voteStatus && (
        <VotersModal
          NQGScore={4.5}
          voteData={voteType ? voteStatus[voteType] : null}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProposalPage;
