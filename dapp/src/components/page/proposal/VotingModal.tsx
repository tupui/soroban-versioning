import Button from "components/utils/Button";
import Modal, { type ModalProps } from "components/utils/Modal";
import Title from "components/utils/Title";
import { voteTypeDescriptionMap, voteTypeLabelMap } from "constants/constants";
import { useState, useEffect } from "react";
import { VoteType } from "types/proposal";
import VoteTypeCheckbox from "./VoteTypeCheckbox";
import { deriveProjectKey } from "../../../utils/projectKey";
import Tansu from "../../../contracts/soroban_tansu";
import { loadedPublicKey } from "../../../service/walletService";

interface VotersModalProps extends ModalProps {
  projectName: string;
  proposalId: number | undefined;
  proposalTitle: string | undefined;
  isVoted?: boolean;
  setIsVoted?: React.Dispatch<React.SetStateAction<boolean>>;
}

const VotingModal: React.FC<VotersModalProps> = ({
  projectName,
  proposalId,
  proposalTitle,
  isVoted,
  setIsVoted,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<VoteType | null>(
    VoteType.APPROVE,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [maxWeight, setMaxWeight] = useState<number>(1);
  const [selectedWeight, setSelectedWeight] = useState<number>(1);

  useEffect(() => {
    let ignore = false;

    const fetchMaxWeight = async () => {
      try {
        const publicKey = loadedPublicKey();
        if (!publicKey) return;

        Tansu.options.publicKey = publicKey;
        const projectKey = deriveProjectKey(projectName);

        const weightTx = await Tansu.get_max_weight({
          project_key: projectKey,
          member_address: publicKey,
        });

        if (!ignore) {
          const weight = Number(weightTx.result) || 1;
          setMaxWeight(weight);
          setSelectedWeight(weight);
        }
      } catch {
        if (!ignore) {
          setMaxWeight(1);
          setSelectedWeight(1);
        }
      }
    };

    fetchMaxWeight();

    return () => {
      ignore = true;
    };
  }, [projectName]);

  const validateVote = (): boolean => {
    if (!selectedOption) {
      setVoteError("You must select one option to vote");
      return false;
    }

    if (isVoted) {
      setVoteError("You have already voted");
      return false;
    }

    if (proposalId === undefined) {
      setVoteError("Proposal ID is required");
      return false;
    }

    setVoteError(null);
    return true;
  };

  const handleVote = async () => {
    if (!validateVote()) return;

    setIsLoading(true);
    const { voteToProposal } = await import("@service/ContractService");

    try {
      await voteToProposal(
        projectName,
        proposalId!,
        selectedOption as VoteType,
        selectedWeight,
      );
      setIsVoted?.(true);
      setStep(2);
    } catch (error: any) {
      setIsLoading(false);

      let errorMessage = "Failed to cast vote";

      if (typeof error === "string") {
        errorMessage += `: ${error}`;
      } else if (error?.message) {
        errorMessage += `: ${error.message}`;
      } else if (error?.code === 4001) {
        // Wallet rejected the transaction
        errorMessage += ": The transaction was cancelled by the user";
      } else {
        // Fallback: stringify unknown error objects
        errorMessage += `: ${JSON.stringify(error)}`;
      }

      setVoteError(errorMessage);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      {step === 1 ? (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-9">
          {/* Image */}
          <img
            src="/images/box-with-coin-outside.svg"
            className="w-40 sm:w-60 md:w-80 lg:w-[360px] h-auto"
          />

          {/* Content */}
          <div className="flex-grow flex flex-col gap-6 sm:gap-9 w-full">
            <Title
              title="Cast Your Vote"
              description={
                <div className="flex flex-wrap gap-1.5">
                  <p>Vote on the proposal:</p>
                  <p className="font-bold text-primary">{proposalTitle}</p>
                </div>
              }
            />

            {[VoteType.APPROVE, VoteType.REJECT, VoteType.CANCEL].map(
              (voteType, index) => (
                <div
                  key={index}
                  className="flex gap-3 cursor-pointer"
                  onClick={() => {
                    setSelectedOption(voteType);
                    setVoteError(null);
                  }}
                >
                  <VoteTypeCheckbox
                    voteType={voteType}
                    currentVoteType={selectedOption}
                  />
                  <div className="flex flex-col justify-center gap-2">
                    <p
                      className={`leading-5 text-lg sm:text-xl font-medium text-${voteType}`}
                    >
                      {voteTypeLabelMap[voteType]}
                    </p>
                    <p className="leading-4 text-sm sm:text-base font-semibold text-primary">
                      {voteTypeDescriptionMap[voteType]}
                    </p>
                  </div>
                </div>
              ),
            )}

            {voteError && (
              <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-2 rounded">
                {voteError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-primary">
                  Voting Power: {selectedWeight.toLocaleString()} /{" "}
                  {maxWeight.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={Math.round((selectedWeight / maxWeight) * 100)}
                  onChange={(e) => {
                    const percentage = Number(e.target.value);
                    setSelectedWeight(
                      Math.round((percentage / 100) * maxWeight),
                    );
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${Math.round((selectedWeight / maxWeight) * 100)}%, #e5e7eb ${Math.round((selectedWeight / maxWeight) * 100)}%, #e5e7eb 100%)`,
                  }}
                />
                <p className="text-xs text-secondary">
                  Slide to adjust your voting power
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              <div className="flex gap-3">
                <Button type="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button
                  isLoading={isLoading}
                  onClick={() => !isLoading && handleVote()}
                >
                  Vote
                </Button>
              </div>
              <p className="text-sm sm:text-base text-secondary text-right">
                Once submitted, your vote cannot be changed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-[18px]">
          {/* Image */}
          <img
            src="/images/box.svg"
            className="w-40 sm:w-60 md:w-80 lg:w-[360px] h-auto"
          />

          {/* Content */}
          <div className="flex-grow flex flex-col gap-6 sm:gap-[30px] w-full">
            <Title
              title={
                <div className="flex gap-3 items-center">
                  <VoteTypeCheckbox size="sm" voteType={selectedOption!} />
                  <span>
                    Your {voteTypeLabelMap[selectedOption!]} Vote Has Been
                    Submitted!
                  </span>
                </div>
              }
              description={
                <>
                  Thank you for voting{" "}
                  <span className={`text-${selectedOption}`}>
                    {voteTypeLabelMap[selectedOption!]}!
                  </span>{" "}
                  Your feedback helps this proposal move closer to execution.
                </>
              }
            />
            <div className="flex justify-end gap-3">
              <Button type="secondary" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onClose}>Ok</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default VotingModal;
