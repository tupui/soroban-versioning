import { useStore } from "@nanostores/react";
import { navigate } from "astro/virtual-modules/transitions-router.js";
import { BackIcon } from "components/icons";
import React, { useState } from "react";
import { projectNameForGovernance } from "utils/store";
import IdeaList from "./IdeaList";
import ProposalList from "./ProposalList";
import ProposalTypeButton from "./ProposalTypeButton";

const ProposalsSection: React.FC = () => {
  const [proposalType, setProposalType] = useState("proposal");
  const projectName = useStore(projectNameForGovernance);

  return (
    <div className="mx-auto max-w-[1048px] flex flex-col gap-9">
      <div className="flex">
        <button
          className="flex gap-[14px]"
          onClick={() => navigate(`/project?name=${projectName}`)}
        >
          <BackIcon />
          <p className="leading-5 text-xl text-[#311255]">
            Back to Project Page
          </p>
        </button>
      </div>
      <div className="py-12 flex flex-col gap-12 bg-[#FFFFFFB8]">
        <div className="px-[16px] lg:px-[72px] flex flex-col gap-9">
          <div className="flex flex-col gap-[18px]">
            <h2 className="leading-6 text-2xl font-medium text-[#311255]">
              Decentralized Autonomous Organization
            </h2>
            <p className="text-base text-[#4C4354]">
              Empowering projects with transparency, trust, and governance.
            </p>
            <div className="h-[1px] bg-[#EEEEEE]" />
          </div>
          <div className="flex">
            <ProposalTypeButton
              proposalTypeStatus={proposalType}
              proposalType="proposal"
              title="Proposals"
              onClick={(proposalType: string) => setProposalType(proposalType)}
            />
            <ProposalTypeButton
              proposalTypeStatus={proposalType}
              proposalType="idea"
              title="Ideas"
              onClick={(proposalType: string) => setProposalType(proposalType)}
            />
          </div>
        </div>
        <div className="px-[16px] lg:px-[72px] w-full">
          {proposalType === "proposal" && <ProposalList />}
          {proposalType === "idea" && <IdeaList />}
        </div>
      </div>
    </div>
  );
};

export default ProposalsSection;
