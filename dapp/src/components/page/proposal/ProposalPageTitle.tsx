import { useStore } from "@nanostores/react";
import Button from "components/utils/Button";
import React, { useEffect, useState } from "react";
import type { ProposalView, VoteType } from "types/proposal";
import { connectedPublicKey } from "utils/store";
import ProposalStatusSection from "./ProposalStatusSection";
import VoteStatusBar from "./VoteStatusBar";
import VotersModal from "./VotersModal";

interface Props {
  proposal: ProposalView | null;
  maintainers: string[];
  submitVote: () => void;
  executeProposal: () => void;
}

const ProposalPageTitle: React.FC<Props> = ({
  proposal,
  maintainers,
  submitVote,
  executeProposal,
}) => {
  const [isMaintainer, setIsMaintainer] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const connectedAddress = useStore(connectedPublicKey);
  const [voteType, setVoteType] = useState<VoteType>();
  const [isVotersModalOpen, setIsVotersModalOpen] = useState(false);

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

  const openVotersModal = (voteType: VoteType) => {
    if (proposal?.status !== "active") {
      setVoteType(voteType);
      setIsVotersModalOpen(true);
    } else {
      alert("Cannot show voters while voting is in progress");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-[30px]">
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center gap-3">
            <p className="text-base text-[#695A77]">Created by</p>
            <div className="flex items-center gap-2">
              {isMaintainer && (
                <div className="p-[2px_10px_4px_10px] bg-[#FFEFA8] rounded-[36px]">
                  <p className="text-base font-semibold text-[#2D0F51]">
                    maintainer
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-2xl font-medium text-primary">
              {proposal?.id} {proposal?.title}
            </p>
            <VoteStatusBar
              approve={proposal?.voteStatus?.approve?.score || 0}
              reject={proposal?.voteStatus?.reject?.score || 0}
              abstain={proposal?.voteStatus?.abstain?.score || 0}
              onClick={(voteType) => openVotersModal(voteType)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex justify-between">
            <ProposalStatusSection
              status={proposal?.status || null}
              endDate={proposal?.endDate || null}
            />
            <Button icon="/icons/vote.svg">Vote</Button>
            {status == "active" && (
              <button
                onClick={() => submitVote()}
                className={`w-full px-3 md:px-4 py-1 sm:py-1.5 md:py-3 ${!isConnected ? "bg-zinc-600" : "bg-zinc-900"} rounded-lg sm:rounded-xl md:rounded-[14px] justify-center gap-2.5 inline-flex`}
              >
                <span className="text-center text-white text-base sm:text-lg md:text-xl font-normal">
                  Vote
                </span>
              </button>
            )}
            {status == "voted" && isMaintainer && (
              <button
                onClick={() => executeProposal()}
                className={`w-full px-3 md:px-4 py-1 sm:py-1.5 md:py-3 ${status !== "voted" ? "bg-zinc-600" : "bg-zinc-900"} rounded-lg sm:rounded-xl md:rounded-[14px] justify-center gap-2.5 inline-flex`}
              >
                <span className="text-center text-white text-base sm:text-lg md:text-xl font-normal">
                  Execute
                </span>
              </button>
            )}
          </div>
          <div className="h-[1px] bg-[#EEEEEE]" />
        </div>
      </div>
      {isVotersModalOpen && proposal?.voteStatus && (
        <VotersModal
          NQGScore={proposal?.nqg || 0}
          voteData={(voteType && proposal?.voteStatus?.[voteType]) || null}
          projectMaintainers={maintainers}
          onClose={() => setIsVotersModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProposalPageTitle;
