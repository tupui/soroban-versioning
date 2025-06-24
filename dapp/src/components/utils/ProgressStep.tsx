import Step from "./Step";
import Title from "./Title";
import type { FC } from "react";

interface Props {
  step: number; // 1-based index (1-6)
}

const captions = [
  "Preparing data…",
  "Creating transaction…",
  "Sign transaction",
  "Uploading to IPFS…",
  "Sending transaction…",
  "Finishing…",
];

const ProgressStep: FC<Props> = ({ step }) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <img src="/images/loading.svg" className="w-16 animate-spin" />
      <Step step={step} totalSteps={6} />
      <Title title={captions[step - 1] || ""} description="" />
    </div>
  );
};

export default ProgressStep;
