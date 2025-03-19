import { votedTypeLabelMap } from "constants/constants";
import { useMemo, type FC } from "react";
import { VoteType, type VoteStatus } from "types/proposal";
import VoteTypeCheckbox from "./VoteTypeCheckbox";

interface Props {
  voteStatus: VoteStatus | undefined;
  withDetail?: boolean;
}

const VotingResult: FC<Props> = ({ voteStatus, withDetail }) => {
  const voteResult = useMemo(() => {
    if (voteStatus) {
      let voteResult: VoteType | undefined = undefined;
      const { approve, abstain } = voteStatus;
      if (approve.score > abstain.score) {
        voteResult = VoteType.APPROVE;
      } else if (approve.score < abstain.score) {
        voteResult = VoteType.REJECT;
      } else {
        voteResult = VoteType.CANCEL;
      }
      return voteResult;
    }
    return undefined;
  }, [voteStatus]);

  return (
    <>
      <div className="flex gap-6">
        {voteResult && (
          <div className="flex flex-col gap-[18px]">
            <p className="leading-4 text-base text-secondary">Final Outcome</p>
            <div className="flex items-center gap-2">
              <VoteTypeCheckbox size="sm" voteType={voteResult} />
              <p className={`leading-5 text-xl font-medium text-${voteResult}`}>
                {votedTypeLabelMap[voteResult]}
              </p>
            </div>
          </div>
        )}
        {withDetail && (
          <div className="flex flex-col gap-[18px]">
            <p className="leading-4 text-base text-secondary">
              Total Votes Cast
            </p>
            <p className="leading-6 text-xl text-primary">
              {voteStatus &&
                voteStatus?.abstain.score +
                  voteStatus?.approve.score +
                  voteStatus?.reject.score}
            </p>
          </div>
        )}
      </div>
      {withDetail && (
        <div className="flex gap-6">
          <div className="flex flex-col gap-[18px]">
            <p className="leading-4 text-base text-approved">Approved</p>
            <p className="leading-6 text-xl text-primary">
              {voteStatus?.approve.score} votes
            </p>
          </div>
          <div className="flex flex-col gap-[18px]">
            <p className="leading-4 text-base text-cancelled">Cancelled</p>
            <p className="leading-6 text-xl text-primary">
              {voteStatus?.abstain.score} votes
            </p>
          </div>
          <div className="flex flex-col gap-[18px]">
            <p className="leading-4 text-base text-rejected">Rejected</p>
            <p className="leading-6 text-xl text-primary">
              {voteStatus?.reject.score} votes
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default VotingResult;
