import Step from "./Step";
import Title from "./Title";
import type { FC } from "react";

interface Props {
  step: number; // 1-based index (1-5)
  /**
   * Label used for the signing step caption.
   * Example: "proposal", "project registration", "membership".
   * Defaults to "proposal" to preserve existing behavior.
   */
  signLabel?: string;
}

const makeCaptions = (signLabel: string) =>
  [
    "Preparing & configuring…",
    `Sign ${signLabel} transaction`,
    "Uploading to IPFS…",
    "Sending transaction…",
    "Finishing…",
  ] as const;

const ProgressStep: FC<Props> = ({ step, signLabel = "proposal" }) => {
  const captions = makeCaptions(signLabel);
  return (
    <div className="flex flex-col items-center gap-6">
      <img src="/images/loading.svg" className="w-16 animate-spin" />
      <Step step={step} totalSteps={5} />
      <Title title={captions[step - 1] || ""} description="" />
      {step === 3 && <div data-testid="ipfs-uploading" />}
      {step === 4 && <div data-testid="tx-sending" />}
      {step === 5 && <div data-testid="finishing" />}
    </div>
  );
};

export default ProgressStep;
