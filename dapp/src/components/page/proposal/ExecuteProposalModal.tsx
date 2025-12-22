import { navigate } from "astro:transitions/client";
import Button from "components/utils/Button";
import Modal, { type ModalProps } from "components/utils/Modal";
import Step from "components/utils/Step";
import Title from "components/utils/Title";
import CopyButton from "components/utils/CopyButton";
import { useMemo, useState, useEffect } from "react";
import {
  VoteResultType,
  type Proposal,
  type ProposalOutcome,
  type VoteStatus,
} from "types/proposal";
import { toast } from "utils/utils";
import VotingResult from "./VotingResult";
import { computeAnonymousVotingData } from "utils/anonymousVoting";
import { loadedPublicKey } from "@service/walletService";
import classNames from "classnames";
import AnonymousTalliesDisplay from "./AnonymousTalliesDisplay";

interface ExecuteProposalModalProps extends ModalProps {
  projectName: string;
  proposalId: number | undefined;
  proposal: Proposal | undefined; // Add proposal data
  outcome: ProposalOutcome | null;
  voteStatus: VoteStatus | undefined;
}

const ExecuteProposalModal: React.FC<ExecuteProposalModalProps> = ({
  projectName,
  proposalId,
  proposal,
  outcome,
  voteStatus,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [seeds, setSeeds] = useState<bigint[] | null>(null);
  const [tallies, setTallies] = useState<bigint[] | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isMaintainer, setIsMaintainer] = useState(false);
  const [decodedVotes, setDecodedVotes] = useState<any[]>([]);
  const [proofOk, setProofOk] = useState<boolean | null>(null);
  const [_privateKey, setPrivateKey] = useState<string>("");

  // Local vote status that may be updated once we compute tallies for
  // anonymous proposals.
  const [displayVoteStatus, setDisplayVoteStatus] = useState<
    VoteStatus | undefined
  >(voteStatus);

  const computedResult = useMemo(() => {
    if (
      !displayVoteStatus ||
      !displayVoteStatus.approve ||
      !displayVoteStatus.abstain ||
      !displayVoteStatus.reject
    ) {
      return null;
    }
    const { approve, abstain, reject } = displayVoteStatus;
    if (approve.score > abstain.score + reject.score) {
      return VoteResultType.APPROVE;
    } else if (reject.score > approve.score + abstain.score) {
      return VoteResultType.REJECT;
    }
    return VoteResultType.CANCEL;
  }, [displayVoteStatus]);

  const executionXdr = useMemo(() => {
    if (!outcome || !computedResult) return null;

    // Check if we have contract outcomes (takes precedence)
    if (proposal?.outcome_contracts && proposal.outcome_contracts.length > 0) {
      return null; // Contract execution handled by smart contract
    }

    // Fall back to XDR execution
    switch (computedResult) {
      case VoteResultType.APPROVE:
        return outcome.approved?.xdr || null;
      case VoteResultType.REJECT:
        return outcome.rejected?.xdr || null;
      case VoteResultType.CANCEL:
        return outcome.cancelled?.xdr || null;
      default:
        return null;
    }
  }, [outcome, computedResult, proposal?.outcome_contracts]);

  useEffect(() => {
    if (
      voteStatus &&
      voteStatus.approve.score === 0 &&
      voteStatus.reject.score === 0 &&
      voteStatus.abstain.score === 0
    ) {
      setIsAnonymous(true);
    }
  }, [voteStatus]);

  useEffect(() => {
    if (!displayVoteStatus) return;
    // computedResult is derived via useMemo; no state updates needed here
  }, [displayVoteStatus]);

  useEffect(() => {
    const checkMaintainer = async () => {
      try {
        const { getProjectFromName } = await import(
          "@service/ReadContractService"
        );
        const project = await getProjectFromName(projectName);
        const addr = loadedPublicKey();
        if (project && addr) {
          setIsMaintainer(project.maintainers.includes(addr));
        }
      } catch (_) {
        setIsMaintainer(false);
      }
    };
    checkMaintainer();
  }, [projectName]);

  const handleKeyFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const file = fileList.item(0);
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.privateKey)
        throw new Error("Invalid key-file – missing privateKey field");
      // Validate uploaded key against on-chain config (centralized helper)
      const { validateAnonymousKeyForProject } = await import(
        "../../../utils/anonymousVoting"
      );
      await validateAnonymousKeyForProject(projectName!, parsed.publicKey);
      setPrivateKey(parsed.privateKey);
      await computeTallies(parsed.privateKey);
    } catch (err: any) {
      // Silent in prod, log only in dev
      if (import.meta.env.DEV) console.error(err);
      setProcessingError(err.message || "Failed to process key-file");
    }
  };

  const computeTallies = async (privKey: string) => {
    if (!projectName || proposalId === undefined) return;
    try {
      const data = await computeAnonymousVotingData(
        projectName,
        proposalId!,
        privKey,
        true,
      );
      setTallies(data.tallies);
      setSeeds(data.seeds);
      setDisplayVoteStatus(data.voteStatus);
      setDecodedVotes(data.decodedVotes);
      setProofOk(data.proofOk ?? null);
      setProcessingError(null);
      if (isAnonymous) setStep(2);
    } catch (err: any) {
      setProcessingError(err.message);
    }
  };

  const signAndExecute = async () => {
    if (!projectName) {
      toast.error("Execute Proposal", "Project name is required");
      return;
    }

    if (proposalId === undefined) {
      toast.error("Execute Proposal", "Proposal ID is required");
      return;
    }

    if (!displayVoteStatus) {
      toast.error("Execute Proposal", "Vote result is required");
      return;
    }

    try {
      const { executeProposal } = await import("@service/ContractService");
      await executeProposal(
        projectName,
        proposalId,
        tallies ?? undefined,
        seeds ?? undefined,
      );
      setStep(step + 1);
      toast.success("Congratulation!", "Proposal executed successfully");
    } catch (error: any) {
      toast.error("Execute Proposal", error.message);
      onClose();
    }
  };

  const totalSteps = isAnonymous ? 4 : 3;

  return (
    <Modal onClose={onClose}>
      {/* ───────────────────────── step 1 ───────────────────────── */}
      {step === 1 && isAnonymous ? (
        <div className="flex flex-col gap-10 px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-[18px]">
            <img
              src="/images/scan.svg"
              alt="Anonymous voting setup"
              className="w-16 sm:w-20 md:w-24 mx-auto sm:mx-0"
            />

            <div className="flex-grow flex flex-col gap-6 sm:gap-[30px] w-full">
              <Step step={step} totalSteps={totalSteps} />
              <Title
                title="Provide the anonymous voting key-file"
                description={
                  <>
                    Upload the private key you downloaded when the proposal was
                    created. It will be used <strong>locally</strong> to decrypt
                    the vote commitments and compute the tallies. The key never
                    leaves your browser.
                  </>
                }
              />

              <div
                className={classNames(
                  "border p-3 w-full rounded-md transition-colors",
                  processingError ? "border-red-500" : "border-zinc-700",
                )}
              >
                <label className="cursor-pointer text-primary underline block text-center sm:text-left">
                  Choose key file
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleKeyFileUpload}
                  />
                </label>
              </div>

              {processingError && (
                <p className="text-red-500 text-sm text-center sm:text-left">
                  {processingError}
                </p>
              )}

              {tallies && (
                <div className="flex flex-col gap-2 text-sm text-primary text-center sm:text-left">
                  <p>Approve: {tallies[0]}</p>
                  <p>Reject: {tallies[1]}</p>
                  <p>Abstain: {tallies[2]}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center sm:justify-end gap-3 sm:gap-[18px]">
            <Button type="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : step === 2 && isAnonymous ? (
        /* ────────────── step 2 (anonymous) – decrypted tallies ───────────── */
        <div className="flex flex-col gap-10 px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-[18px]">
            <img
              src="/images/box-with-coin-inside.svg"
              alt="Decrypted tallies"
              className="w-16 sm:w-20 md:w-24 mx-auto sm:mx-0"
            />

            <div className="flex-grow flex flex-col gap-6 sm:gap-[30px] w-full">
              <Step step={step} totalSteps={totalSteps} />
              <Title
                title="Decrypted tallies"
                description="Below are the tallies computed from decrypted votes."
              />

              <AnonymousTalliesDisplay
                voteStatus={displayVoteStatus}
                decodedVotes={decodedVotes}
                proofOk={proofOk}
              />
            </div>
          </div>

          <div className="flex justify-center sm:justify-end gap-3 sm:gap-[18px]">
            <Button type="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      ) : step === 1 ? (
        <div className="flex flex-col gap-10 sm:gap-[42px]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-[18px]">
            <img
              src="/images/lock-in-box.svg"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0"
              alt="Lock in box"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-[30px] text-center sm:text-left">
              <Step step={step} totalSteps={totalSteps} />
              <Title
                title="Finalizing the Vote"
                description="The voting period has ended. Now, we need to count the votes and determine the final outcome."
              />
              <VotingResult voteStatus={displayVoteStatus} withDetail />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-[18px]">
            <Button type="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!isMaintainer) {
                  toast.error(
                    "Execute Proposal",
                    "Only maintainers can finalize votes",
                  );
                  return;
                }
                setStep(2);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : step === (isAnonymous ? 3 : 2) ? (
        <div className="flex flex-col gap-10 sm:gap-[42px]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-[18px]">
            <img
              src="/images/scan.svg"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0"
              alt="Scan"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-[30px] text-center sm:text-left">
              <Step step={step} totalSteps={totalSteps} />
              <Title
                title="Finalize the Vote Execution"
                description="Review the transaction details before execution. You can verify the XDR and proceed with the final step."
              />
              <VotingResult voteStatus={displayVoteStatus} />

              {executionXdr && (
                <div className="flex flex-col items-center sm:items-start gap-4 sm:gap-[18px]">
                  <p className="leading-4 text-base text-secondary">XDR</p>
                  <div className="p-2 sm:p-[8px_18px] bg-[#FFEFA8] flex flex-col sm:flex-row items-center gap-3 sm:gap-[18px] rounded-lg">
                    <p className="leading-[18px] text-lg text-primary break-all sm:break-normal text-center sm:text-left">
                      {executionXdr.slice(0, 24) + "..."}
                    </p>
                    <CopyButton textToCopy={executionXdr} size="sm" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-[18px]">
            <Button type="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
            <Button
              onClick={async () => {
                if (!isMaintainer) {
                  toast.error(
                    "Execute Proposal",
                    "Only maintainers can execute proposals",
                  );
                  return;
                }
                await signAndExecute();
              }}
            >
              Execute Transaction
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10 sm:gap-[42px]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-[18px]">
            <img
              src="/images/flower.svg"
              className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0"
              alt="Success Icon"
            />
            <div className="flex-grow flex flex-col gap-6 sm:gap-[30px] text-center sm:text-left">
              <Step step={step} totalSteps={totalSteps} />
              <Title
                title="Your Vote Is Officially Executed!"
                description="Congratulations! You've successfully executed your vote, and the final status has been updated."
              />
              <VotingResult voteStatus={displayVoteStatus} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-[18px]">
            <Button type="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="secondary" icon="/icons/share.svg">
              Share
            </Button>
            <Button
              onClick={() =>
                navigate(`/proposal?id=${proposalId}&name=${projectName}`)
              }
            >
              View Proposal
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExecuteProposalModal;
