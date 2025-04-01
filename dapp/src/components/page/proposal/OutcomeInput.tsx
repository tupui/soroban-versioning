import Button from "components/utils/Button";
import Textarea from "components/utils/Textarea";
import { capitalizeFirstLetter } from "utils/utils";

interface OutcomeInputProps {
  type: string;
  description: string;
  setDescription: (description: string) => void;
  xdr: string | null;
  setXdr: (xdr: string) => void;
}

const OutcomeInput = ({
  type,
  description,
  setDescription,
  xdr,
  setXdr,
}: OutcomeInputProps) => {
  return (
    <div className="flex flex-col items-start gap-[18px]">
      <div className={`text-xl font-medium text-${type}`}>
        {capitalizeFirstLetter(type)} Outcome
      </div>
      {xdr == null ? (
        <Button type="secondary" onClick={() => setXdr("")}>
          Add Canceled Outcome
        </Button>
      ) : (
        <div className="w-full flex flex-col gap-[18px]">
          <div className="flex flex-col gap-[18px]">
            <p className="leading-[16px] text-base font-[600] text-primary">
              Description
            </p>
            <Textarea
              placeholder="Write the description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-[18px]">
            <p className="leading-[16px] text-base font-[600] text-primary">
              XDR (Optional)
            </p>
            <Textarea
              className="h-[64px]"
              placeholder="Write the XDR"
              value={xdr}
              onChange={(e) => {
                setXdr(e.target.value);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OutcomeInput;
