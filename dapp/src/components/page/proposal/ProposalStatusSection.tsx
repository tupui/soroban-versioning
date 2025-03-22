import React, { useMemo } from "react";
import { VoteType, type ProposalView } from "types/proposal";
import { capitalizeFirstLetter } from "utils/utils";
import { calculateDateDifference } from "../../../utils/formatTimeFunctions";

interface Props {
  proposal: ProposalView | null;
}

const ProposalStatusSection: React.FC<Props> = ({ proposal }) => {
  const { status, voteResult, endDate } = useMemo(() => {
    if (!proposal) return {};
    const status = proposal.status;
    const voteStatus = proposal.voteStatus;
    let voteResult: VoteType | undefined = undefined;
    const { approve, abstain } = voteStatus;
    if (approve.score > abstain.score) {
      voteResult = VoteType.APPROVE;
    } else if (approve.score < abstain.score) {
      voteResult = VoteType.REJECT;
    } else {
      voteResult = VoteType.CANCEL;
    }

    return {
      status:
        status == "voted"
          ? "pending execution"
          : status == "active"
            ? "active"
            : "finished",
      voteResult: ["approved", "rejected", "cancelled"].includes(status)
        ? voteResult
        : undefined,
      endDate: status == "active" ? proposal.endDate : undefined,
    };
  }, [proposal]);

  return (
    <div className="grid grid-cols-2 gap-[18px]">
      {status && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-tertiary">Status</p>
          <p className="text-lg text-tertiary">
            {capitalizeFirstLetter(status)}
          </p>
        </div>
      )}
      {voteResult && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-tertiary">Result</p>
          <p className={`text-lg text-${voteResult}`}>
            {capitalizeFirstLetter(voteResult as string)}
          </p>
        </div>
      )}
      {endDate && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-tertiary">End date</p>
          <p className={`text-lg text-${status}`}>
            {calculateDateDifference(endDate)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProposalStatusSection;
