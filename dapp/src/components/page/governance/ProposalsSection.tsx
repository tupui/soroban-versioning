import React from "react";
import { useState } from "react";
import ProposalTypeButton from "./ProposalTypeButton";
import ProposalList from "./ProposalList";

const ProposalsSection: React.FC = () => {
  const [proposalType, setProposalType] = useState("proposal");

  return (
    <div className="my-6 sm:my-12 md:my-14">
      <div className="flex items-center">
        <ProposalTypeButton
          proposalTypeStatus={proposalType}
          proposalType="proposal"
          title="Proposals"
          position="start"
          onClick={(proposalType: string) => setProposalType(proposalType)}
        />
        <ProposalTypeButton
          proposalTypeStatus={proposalType}
          proposalType="idea"
          title="Ideas"
          position="end"
          onClick={(proposalType: string) => setProposalType(proposalType)}
        />
      </div>
      <div className="w-full">
        <ProposalList />
      </div>
    </div>
  );
};

export default ProposalsSection;