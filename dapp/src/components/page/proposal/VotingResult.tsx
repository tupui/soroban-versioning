import { votedTypeLabelMap } from "constants/constants";
import { useMemo, type FC } from "react";
import { VoteType, type VoteStatus } from "types/proposal";
import VoteTypeCheckbox from "./VoteTypeCheckbox";

interface Props {
  voteStatus: VoteStatus | undefined;
  withDetail?: boolean;
  totalVotesOverride?: number;
  // When provided, the per-option numbers shown to users are counts of ballots,
  // not weighted scores. Final outcome still uses weighted scores.
  countsOverride?: { approve: number; reject: number; abstain: number };
}

const VotingResult: FC<Props> = ({
  voteStatus,
  withDetail,
  totalVotesOverride,
  countsOverride,
}) => {
  const voteResult = useMemo(() => {
    if (voteStatus) {
      let voteResult: VoteType | undefined = undefined;
      const { approve, abstain, reject } = voteStatus;
      if (approve.score > abstain.score + reject.score) {
        voteResult = VoteType.APPROVE;
      } else if (reject.score > approve.score + abstain.score) {
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
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {voteResult && (
          <div className="flex flex-col gap-[18px]">
            <p className="leading-4 text-base text-secondary">Final Outcome</p>
            <div className="flex items-center gap-2">
              <VoteTypeCheckbox size="sm" voteType={voteResult} />
              <p
                className={`leading-5 text-lg md:text-xl font-medium text-${voteResult}`}
              >
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
            <p className="leading-6 text-lg md:text-xl text-primary">
              {totalVotesOverride !== undefined
                ? totalVotesOverride
                : countsOverride
                  ? countsOverride.abstain +
                    countsOverride.approve +
                    countsOverride.reject
                  : voteStatus &&
                    voteStatus.abstain.score +
                      voteStatus.approve.score +
                      voteStatus.reject.score}
            </p>
          </div>
        )}
      </div>

      {withDetail && (
        <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6 mt-4">
          <div className="flex flex-col gap-[18px] min-w-[120px]">
            <p className="leading-4 text-base text-approved">Approved</p>
            <p className="leading-6 text-lg md:text-xl text-primary">
              {countsOverride
                ? countsOverride.approve
                : voteStatus?.approve.score}{" "}
              votes
            </p>
          </div>

          <div className="flex flex-col gap-[18px] min-w-[120px]">
            <p className="leading-4 text-base text-cancelled">Cancelled</p>
            <p className="leading-6 text-lg md:text-xl text-primary">
              {countsOverride
                ? countsOverride.abstain
                : voteStatus?.abstain.score}{" "}
              votes
            </p>
          </div>

          <div className="flex flex-col gap-[18px] min-w-[120px]">
            <p className="leading-4 text-base text-rejected">Rejected</p>
            <p className="leading-6 text-lg md:text-xl text-primary">
              {countsOverride
                ? countsOverride.reject
                : voteStatus?.reject.score}{" "}
              votes
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default VotingResult;
