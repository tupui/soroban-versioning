import React from "react";
import ProposalPageTitle from "./ProposalPageTitle";
import ProposalStatusSection from "./ProposalStatusSection";
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
    </div>
  );
};

export default ProposalPage;
