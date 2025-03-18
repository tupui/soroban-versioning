import { useStore } from "@nanostores/react";
import Button from "components/utils/Button";
import React, { useEffect, useState } from "react";
import type { ProposalView } from "types/proposal";
import { connectedPublicKey } from "utils/store";
import { toast } from "utils/utils";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import VotingResultModal from "./VotingResultModal";

interface Props {
  proposal: ProposalView;
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
  }, [connectedAddress]);

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
      <div className="flex gap-[30px]">
        {proposal?.status == "active" ? (
          <img src="/images/box-with-coin-outside.svg" />
        ) : proposal?.status == "cancelled" || proposal?.status == "voted" ? (
          <img src="/images/box-with-coin-inside.svg" />
        ) : (
          <img src="/images/box.svg" />
        )}
        <div className="flex-grow flex flex-col gap-[30px]">
          <div className="flex flex-col gap-[18px]">
            {isMaintainer && (
              <div className="flex items-center gap-3">
                {/* <p className="leading-4 text-base text-[#695A77]">Created by</p> */}
                <div className="flex items-center gap-2">
                  {/* <p className="leading-4 text-base font-semibold text-primary">
                    @
                  </p> */}
                  <div className="p-[2px_10px_4px_10px] bg-[#FFEFA8] rounded-[36px]">
                    <p className="leading-4 text-base font-semibold text-[#2D0F51]">
                      maintainer
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <p className="text-2xl font-medium text-primary">
                {proposal?.id} {proposal?.title}
              </p>
              <div className="flex items-center gap-3">
                <VoteStatusBar
                  approve={proposal?.voteStatus?.approve?.score || 0}
                  reject={proposal?.voteStatus?.reject?.score || 0}
                  abstain={proposal?.voteStatus?.abstain?.score || 0}
                />
                <Button
                  type="secondary"
                  size="2xs"
                  icon="/icons/eye.svg"
                  onClick={openVotingResultModal}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex justify-between">
              <ProposalStatusSection proposal={proposal} />
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
    </>
  );
};

export default ProposalTitle;
