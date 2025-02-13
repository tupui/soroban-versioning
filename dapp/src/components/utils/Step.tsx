import type { FC } from "react";

interface Props {
  step: number;
  totalSteps: number;
}

const Step: FC<Props> = ({ step, totalSteps }) => {
  return (
    <div className="flex flex-col gap-3">
      <p className="leading-4 text-base text-secondary">
        Step {step} Of {totalSteps}
      </p>
      <div className="h-1.5 bg-[#F5F1F9]">
        <div
          className="h-full bg-[#FFBD1E]"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Step;
