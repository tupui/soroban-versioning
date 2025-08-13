import Modal, { type ModalProps } from "components/utils/Modal";
import Title from "components/utils/Title";
import Step from "components/utils/Step";
import Button from "components/utils/Button";
import AnonymousTalliesDisplay from "./AnonymousTalliesDisplay";
import React, { useState } from "react";
import { computeAnonymousVotingData } from "utils/anonymousVoting";
import type { VoteStatus } from "types/proposal";
import classNames from "classnames";

interface Props extends ModalProps {
  projectName: string;
  proposalId: number;
}

const VerifyAnonymousVotesModal: React.FC<Props> = ({
  projectName,
  proposalId,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [tallies, setTallies] = useState<number[] | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [proofOk, setProofOk] = useState<boolean | null>(null);
  const [decodedVotes, setDecodedVotes] = useState<any[]>([]);

  const computeTalliesAndProof = async (privKey: string) => {
    try {
      const data = await computeAnonymousVotingData(
        projectName!,
        proposalId,
        privKey,
        true,
      );
      setTallies(data.tallies);
      setVoteStatus(data.voteStatus);
      setProofOk(data.proofOk ?? null);
      setDecodedVotes(data.decodedVotes);
      return data.decodedVotes.length;
    } catch (err: any) {
      setProcessingError(err.message || "Failed to process key file");
      setStep(1);
      return 0;
    }
  };

  const handleKeyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const file = fileList.item(0);
      if (!file) return;
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!parsed.privateKey) throw new Error("Invalid key file");
      setProcessingError(null);
      const count = await computeTalliesAndProof(parsed.privateKey);
      if (count > 0) setStep(2);
    } catch (err: any) {
      setProcessingError(err.message);
    }
  };

  return (
    <Modal onClose={onClose}>
      {step === 1 ? (
        <div className="flex flex-col gap-[30px]">
          <Step step={1} totalSteps={2} />
          <Title
            title="Upload anonymous key file"
            description="The private key will be used locally to decrypt votes and verify the proof."
          />
          <div
            className={classNames(
              "border",
              processingError ? "border-red-500" : "border-zinc-700",
              "p-3",
            )}
          >
            <label className="cursor-pointer text-primary underline">
              Choose key file
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleKeyUpload}
              />
            </label>
          </div>
          {processingError && (
            <p className="text-red-500 text-sm">{processingError}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-[30px]">
          <Step step={2} totalSteps={2} />
          <Title
            title="Decrypted tallies"
            description="Below are the tallies computed from decrypted votes."
          />
          <AnonymousTalliesDisplay
            voteStatus={voteStatus || undefined}
            decodedVotes={decodedVotes}
            proofOk={proofOk}
          />
          <div className="flex justify-end">
            <Button type="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default VerifyAnonymousVotesModal;
