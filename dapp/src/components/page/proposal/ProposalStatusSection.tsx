import React, { useMemo } from "react";
import { VoteType, type ProposalView } from "types/proposal";
import { capitalizeFirstLetter } from "utils/utils";
import { calculateDateDifference } from "../../../utils/formatTimeFunctions";

interface Props {
  proposal: ProposalView;
}

const ProposalStatusSection: React.FC<Props> = ({ proposal }) => {
  const { status, voteResult, endDate } = useMemo(() => {
    const status = proposal.status;
    const voteStatus = proposal.voteStatus;
    const sortedVoteResult = [
      VoteType.APPROVE,
      VoteType.CANCEL,
      VoteType.REJECT,
    ]
      .map((voteType) => ({
        type: voteType,
        score: voteStatus[voteType].score,
      }))
      .sort((a, b) => b.score - a.score);

    return {
      status: status == "voted" ? "pending execution" : status == "active" ? "active" : "finished",
      voteResult: ["approved", "rejected", "cancelled"].includes(status) ? sortedVoteResult[0]?.type : undefined,
      endDate: status == "active" ? proposal.endDate : undefined,
    }
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
