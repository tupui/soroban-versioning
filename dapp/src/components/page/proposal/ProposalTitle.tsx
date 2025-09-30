import { useStore } from "@nanostores/react";
import Button from "components/utils/Button";
import { useEffect, useState } from "react";
import type { ProposalView } from "types/proposal";
import { connectedPublicKey } from "utils/store";
import { toast, truncateMiddle } from "utils/utils";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import VotingResultModal from "./VotingResultModal";
import VerifyAnonymousVotesModal from "./VerifyAnonymousVotesModal";

interface Props {
  proposal: ProposalView | null;
  maintainers: string[];
  submitVote: () => void;
  executeProposal: () => void;
}

const ProposalTitle: React.FC<Props> = ({
  proposal,
  maintainers,
  submitVote,
  executeProposal,
}) => {
  const connectedAddress = useStore(connectedPublicKey);
  const [isMaintainer, setIsMaintainer] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showVotingResultModal, setShowVotingResultModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const checkIsConnected = () => {
    if (connectedAddress) {
      setIsConnected(true);
    } else {
      if (isConnected) {
        setIsConnected(false);
      }
    }
  };

  const checkIsMaintainer = () => {
    if (connectedAddress) {
      const isMaintainer = maintainers.includes(connectedAddress);
      setIsMaintainer(isMaintainer);
    } else {
      setIsMaintainer(false);
    }
  };

  useEffect(() => {
    checkIsMaintainer();
    checkIsConnected();
  }, [connectedAddress, maintainers]);

  const openVotingResultModal = () => {
    if (proposal?.status == "active") {
      toast.error(
        "Voting Result",
        "Cannot show voters while voting is in progress",
      );
      return;
    }
    setShowVotingResultModal(true);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 md:gap-[30px]">
        {proposal?.status == "active" ? (
          <img
            src="/images/box-with-coin-outside.svg"
            className="w-12 sm:w-16 md:w-auto"
          />
        ) : proposal?.status == "cancelled" || proposal?.status == "voted" ? (
          <img
            src="/images/box-with-coin-inside.svg"
            className="w-12 sm:w-16 md:w-auto"
          />
        ) : (
          <img src="/images/box.svg" className="w-12 sm:w-16 md:w-auto" />
        )}
        <div className="flex-grow flex flex-col gap-4 md:gap-[30px]">
          <div className="flex flex-col gap-3 md:gap-[18px]">
            <div className="flex items-center gap-3">
              <p className="leading-4 text-base text-[#695A77]">Created by</p>
              <div className="flex items-center gap-2">
                <p className="leading-4 text-base font-semibold text-primary font-mono">
                  {proposal?.proposer
                    ? truncateMiddle(proposal.proposer, 20)
                    : ""}
                </p>
                {isMaintainer && (
                  <div className="p-[2px_10px_4px_10px] bg-[#FFEFA8] rounded-[36px]">
                    <p className="leading-4 text-base font-semibold text-[#2D0F51]">
                      maintainer
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xl sm:text-2xl font-medium text-primary break-words">
                {proposal?.id} {proposal?.title}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <VoteStatusBar
                  approve={proposal?.voteStatus?.approve?.score || 0}
                  reject={proposal?.voteStatus?.reject?.score || 0}
                  abstain={proposal?.voteStatus?.abstain?.score || 0}
                />
                {(proposal?.voteStatus?.approve?.score || 0) +
                  (proposal?.voteStatus?.reject?.score || 0) +
                  (proposal?.voteStatus?.abstain?.score || 0) >
                0 ? (
                  <Button
                    type="secondary"
                    size="2xs"
                    icon="/icons/eye.svg"
                    onClick={openVotingResultModal}
                  />
                ) : isMaintainer ? (
                  <Button
                    type="secondary"
                    size="2xs"
                    icon="/icons/eye.svg"
                    onClick={() => setShowVerifyModal(true)}
                  />
                ) : (
                  <span className="text-sm text-secondary">
                    Anonymous voting
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
              <ProposalStatusSection proposal={proposal} />
              <div className="flex gap-4 sm:gap-6">
                {proposal?.status == "active" && (
                  <Button
                    size="sm"
                    icon="/icons/vote.svg"
                    onClick={() => submitVote()}
                  >
                    Vote
                  </Button>
                )}
                {proposal?.status == "voted" && isMaintainer && (
                  <Button
                    size="sm"
                    icon="/icons/finalize-vote.svg"
                    onClick={() => executeProposal()}
                  >
                    Finalize Vote
                  </Button>
                )}
              </div>
            </div>
            <div className="h-[1px] bg-[#EEEEEE]" />
          </div>
        </div>
      </div>
      {showVotingResultModal && proposal?.voteStatus && (
        <VotingResultModal
          voteStatus={proposal?.voteStatus}
          projectMaintainers={maintainers}
          onClose={() => setShowVotingResultModal(false)}
        />
      )}
      {showVerifyModal && proposal && (
        <VerifyAnonymousVotesModal
          projectName={proposal.projectName}
          proposalId={proposal.id}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </>
  );
};

export default ProposalTitle;
