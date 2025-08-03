import React from "react";
import ProposalList from "./ProposalList";

const ProposalsSection: React.FC = () => {
  return (
    <div className="flex flex-col gap-9 bg-[#FFFFFFB8]">
      <div className="py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-[72px] flex flex-col gap-6 sm:gap-8 md:gap-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-[18px]">
          <img
            src="/images/box-with-coin-outside.svg"
            className="w-12 sm:w-auto"
          />
          <div className="flex flex-col gap-3 sm:gap-[18px] w-full">
            <h2 className="leading-6 text-xl sm:text-2xl font-medium text-primary">
              Decentralized Autonomous Organization
            </h2>
            <p className="text-sm sm:text-base text-secondary">
              Empowering projects with transparency, trust, and governance.
            </p>
            <div className="h-[1px] bg-[#EEEEEE]" />
          </div>
        </div>
        <div>
          <ProposalList />
        </div>
      </div>
    </div>
  );
};

export default ProposalsSection;
