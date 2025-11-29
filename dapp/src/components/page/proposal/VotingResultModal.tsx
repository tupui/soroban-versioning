import Button from "components/utils/Button";
import Modal, { type ModalProps } from "components/utils/Modal";
import { votedTypeLabelMap } from "constants/constants";
import { useEffect, useMemo, useState, type FC } from "react";
import type { VoteStatus } from "types/proposal";
import { VoteType } from "types/proposal";
import { truncateMiddle } from "utils/utils";
import VotingResult from "./VotingResult";
import { loadConfigData } from "@service/StateService";

interface VotingResultModal extends ModalProps {
  voteStatus?: VoteStatus;
  projectMaintainers: string[];
}

const VotingResultModal: React.FC<VotingResultModal> = ({
  voteStatus,
  projectMaintainers,
  onClose,
}) => {
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
        <img
          src="/images/heart-arrow-target.svg"
          className="w-16 sm:w-auto mx-auto sm:mx-0"
          alt="Voting Results"
        />
        <div className="flex-grow flex flex-col gap-6 sm:gap-[30px]">
          <div className="flex flex-col gap-2 sm:gap-3 text-center sm:text-left">
            <p className="leading-6 text-lg sm:text-xl font-medium text-primary">
              Voting Results
            </p>
            <p className="text-sm sm:text-base text-secondary">
              The voting period has ended. Below are the final results.
            </p>
          </div>

          <VotingResult voteStatus={voteStatus} withDetail />

          <Voters
            voteStatus={voteStatus}
            projectMaintainers={projectMaintainers}
            onlyMaintainers
          />

          <Voters
            voteStatus={voteStatus}
            projectMaintainers={projectMaintainers}
            onlyMaintainers={false}
          />

          <div className="flex justify-center sm:justify-end">
            <Button onClick={onClose}>Got It</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VotingResultModal;

interface VotersProps {
  voteStatus: VoteStatus | undefined;
  projectMaintainers: string[];
  onlyMaintainers: boolean;
}

const Voters: FC<VotersProps> = ({
  voteStatus,
  projectMaintainers,
  onlyMaintainers,
}) => {
  const [currentType, setCurrentType] = useState<VoteType>(VoteType.APPROVE);
  const [showAll, setShowAll] = useState(false);

  const configData = useMemo(() => loadConfigData(), []);

  const voters = useMemo(() => {
    return voteStatus?.[currentType].voters
      .filter(
        (voter) =>
          projectMaintainers.includes(voter.address) == onlyMaintainers,
      )
      .map((voter) => {
        const index = configData?.maintainersAddresses.findIndex(
          (maintainer) => maintainer == voter.address,
        );
        if (index != undefined && index >= 0) {
          return {
            ...voter,
            name: voter?.name || configData?.authorHandles[index],
          };
        }
        return voter;
      });
  }, [currentType]);

  useEffect(() => {
    setShowAll(false);
  }, [currentType]);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-3">
        <p className="leading-4 text-base text-secondary">
          {onlyMaintainers ? "Maintainers" : "Community"}
        </p>
        <div className="flex">
          {[VoteType.APPROVE, VoteType.REJECT, VoteType.CANCEL].map(
            (type, index) => (
              <VoteTypeSelectButton
                key={index}
                label={votedTypeLabelMap[type]}
                type={type}
                currentType={currentType}
                setCurrentType={setCurrentType}
              />
            ),
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-9 gap-y-[18px]">
        {voters
          ?.filter((_: any, index: number) => index < 4 || showAll)
          .map((voter: any, index: number) => (
            <div className="flex flex-col justify-end gap-2" key={index}>
              {voter.name && (
                <p className="leading-6 text-xl text-primary">@{voter.name}</p>
              )}
              <p className="leading-[14px] text-sm text-secondary">
                ({truncateMiddle(voter.address, 16)})
              </p>
            </div>
          ))}
      </div>
      <div className="flex">
        {voters && voters.length > 4 && (
          <Button
            type="secondary"
            size="xs"
            onClick={() => setShowAll(!showAll)}
          >
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-primary" />
              <div className="w-1 h-1 bg-primary" />
              <div className="w-1 h-1 bg-primary" />
            </div>
          </Button>
        )}
      </div>
    </div>
  );
};

interface VoteTypeSelectButtonProps {
  label: string;
  type: VoteType;
  currentType: VoteType;
  setCurrentType: (type: VoteType) => void;
}

const VoteTypeSelectButton: FC<VoteTypeSelectButtonProps> = ({
  label,
  type,
  currentType,
  setCurrentType,
}) => {
  return (
    <button
      className={`p-[6px_12px] ${type == currentType && "bg-[#FFBD1E]"} border border-[#FFBD1E]`}
      onClick={() => setCurrentType(type)}
    >
      <p className="leading-4 text-base font-medium text-primary">
        {label} Votes
      </p>
    </button>
  );
};
