import Button from "components/utils/Button";
import Textarea from "components/utils/Textarea";
import { capitalizeFirstLetter } from "utils/utils";
import { useState, useEffect } from "react";

interface OutcomeInputProps {
  type: string;
  description: string;
  setDescription: (description: string) => void;
  xdr: string | null;
  setXdr: (xdr: string | null) => void;
  descriptionError?: string | null;
  xdrError?: string | null;
  onDescriptionChange?: (value: string) => void;
  onXdrChange?: (value: string) => void;
}

// Simplify the component - remove all contract-related logic
const OutcomeInput = ({
  type,
  description,
  setDescription,
  xdr,
  setXdr,
  descriptionError,
  xdrError,
  onDescriptionChange,
  onXdrChange,
}: OutcomeInputProps) => {
  const [hasXdr, setHasXdr] = useState(false);

  useEffect(() => {
    setHasXdr(xdr !== null);
  }, [xdr]);

  return (
    <div className="flex flex-col items-start gap-[18px]">
      <div className={`text-xl font-medium text-${type}`}>
        {capitalizeFirstLetter(type)} Outcome
      </div>
      {!hasXdr ? (
        <Button type="secondary" onClick={() => setXdr("")}>
          Add XDR Outcome
        </Button>
      ) : (
        <div className="w-full flex flex-col gap-[18px]">
          <div className="flex flex-col gap-[18px]">
            <p className="leading-[16px] text-base font-[600] text-primary">
              Description
            </p>
            <div>
              <Textarea
                placeholder="Write the description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (onDescriptionChange) onDescriptionChange(e.target.value);
                }}
                className={descriptionError ? "border-red-500" : ""}
              />
              {descriptionError && (
                <p className="mt-1 text-sm text-red-500">{descriptionError}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-[18px]">
            <p className="leading-[16px] text-base font-[600] text-primary">
              XDR (Optional)
            </p>
            <div>
              <Textarea
                className={`h-[64px] ${xdrError ? "border-red-500" : ""}`}
                placeholder="Write the XDR"
                value={xdr || ""}
                onChange={(e) => {
                  setXdr(e.target.value);
                  if (onXdrChange) onXdrChange(e.target.value);
                }}
              />
              {xdrError && (
                <p className="mt-1 text-sm text-red-500">{xdrError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutcomeInput;