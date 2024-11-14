import React from "react";
import ProposalPageTitle from "./ProposalPageTitle";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import { useStore } from "@nanostores/react";
import { proposalId } from "utils/store";

const ProposalPage: React.FC = () => {
  const id = useStore(proposalId);

  return (
    <div>
      <ProposalPageTitle
        id={id}
        title="Bounty of issue: integrate DAO system to Tansu - $3000"
        submitVote={() => {}}
      />
      <ProposalStatusSection status="active" endDate={"2024-11-24"} />
      <div className="mt-3 sm:mt-5 md:mt-7">
        <VoteStatusBar interest={50} conflict={30} abstain={20} />
      </div>
    </div>
  );
};

export default ProposalPage;
