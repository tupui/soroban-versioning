import { useStore } from "@nanostores/react";
import Button from "components/utils/Button";
import React from "react";
import type { ProposalView } from "types/proposal";
import { projectNameForGovernance } from "utils/store";
import ProposalStatusSection from "../proposal/ProposalStatusSection";

interface Props {
  proposal: ProposalView;
  onVoteClick?: () => void;
}

const ProposalCard: React.FC<Props> = ({
  proposal,
  onVoteClick,
}) => {
  const projectName = useStore(projectNameForGovernance);

  return (
    <a
      href={`/proposal?id=${proposal.id}&name=${projectName}`}
      className="p-[30px] flex flex-col gap-6 bg-white cursor-pointer"
    >
      <div className="flex justify-between">
        <p className="text-xl font-medium text-primary">{proposal.title}</p>
        <div className="flex gap-[18px] text-xl">
          <span className="text-tertiary">ID:</span>
          <span className="text-primary">{proposal.id}</span>
        </div>
      </div>
      <div className="flex justify-between">
        <ProposalStatusSection proposal={proposal} />
        {proposal.status == "active" && (
          <Button icon="/icons/vote.svg" onClick={(e) => {
            e.preventDefault();
            onVoteClick?.();
          }}>
            Vote
          </Button>
        )}
      </div>
    </a>
  );
};

export default ProposalCard;
