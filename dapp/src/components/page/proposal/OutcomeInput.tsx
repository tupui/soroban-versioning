import Button from "components/utils/Button";
import Textarea from "components/utils/Textarea";
import Input from "components/utils/Input";
import OutcomeModeSelector from "./OutcomeModeSelector";
import EnhancedContractFunctionSelector from "components/EnhancedContractFunctionSelector";
import { capitalizeFirstLetter } from "utils/utils";
import type { OutcomeContract } from "types/proposal";

interface OutcomeInputProps {
  type: string;
  description: string;
  setDescription: (description: string) => void;

  // XDR mode props
  xdr: string | null;
  setXdr: (xdr: string) => void;

  // Contract mode props
  contractOutcome: OutcomeContract | null;
  setContractOutcome: (contract: OutcomeContract | null) => void;

  // Mode selection
  mode: "xdr" | "contract";
  setMode: (mode: "xdr" | "contract") => void;

  // Validation errors
  descriptionError?: string | null;
  xdrError?: string | null;
  contractError?: string | null;

  // Callbacks
  onDescriptionChange?: (value: string) => void;
  onXdrChange?: (value: string) => void;
  onModeChange?: (mode: "xdr" | "contract") => void;
  onRemove?: () => void;

  // Network for contract explorer
  network?: string;
}

const OutcomeInput = ({
  type,
  description,
  setDescription,
  xdr,
  setXdr,
  contractOutcome,
  setContractOutcome,
  mode,
  setMode,
  descriptionError,
  xdrError,
  contractError,
  onDescriptionChange,
  onXdrChange,
  onModeChange,
  onRemove,
  network = "testnet", // Default to testnet
}: OutcomeInputProps) => {
  const handleModeChange = (newMode: "xdr" | "contract") => {
    setMode(newMode);
    if (onModeChange) onModeChange(newMode);

    // Clear the other mode's data when switching
    if (newMode === "xdr") {
      setContractOutcome(null);
    } else {
      setXdr(null);
    }
  };

  const handleContractFunctionSelect = (functionName: string, args: any[]) => {
    if (contractOutcome) {
      setContractOutcome({
        ...contractOutcome,
        execute_fn: functionName,
        args,
      });
    }
  };

  const handleContractAddressChange = (address: string) => {
    setContractOutcome({
      address,
      execute_fn: contractOutcome?.execute_fn || "",
      args: contractOutcome?.args || [],
    });
  };

  const hasOutcome =
    (mode === "xdr" && xdr !== null) ||
    (mode === "contract" && contractOutcome !== null);

  return (
    <div className="flex flex-col items-start gap-[18px]">
      <div className={`text-xl font-medium text-${type}`}>
        {capitalizeFirstLetter(type)} Outcome
      </div>

      {!hasOutcome ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <OutcomeModeSelector mode={mode} onModeChange={handleModeChange} />
          </div>
          <Button
            type="secondary"
            onClick={() => {
              if (mode === "xdr") {
                setXdr("");
              } else {
                setContractOutcome({
                  address: "",
                  execute_fn: "",
                  args: [],
                });
              }
            }}
          >
            Add {capitalizeFirstLetter(type)} Outcome
          </Button>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-[18px]">
          {/* Mode Selector */}
          <div className="flex items-center justify-between">
            <OutcomeModeSelector mode={mode} onModeChange={handleModeChange} />
            <Button
              type="secondary"
              size="sm"
              onClick={() => {
                if (onRemove) {
                  onRemove();
                } else {
                  // Fallback: just clear the values
                  if (mode === "xdr") {
                    setXdr(null);
                  } else {
                    setContractOutcome(null);
                  }
                }
              }}
            >
              Remove
            </Button>
          </div>

          {/* Description */}
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

          {/* Mode-specific content */}
          {mode === "xdr" ? (
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
          ) : (
            <div className="flex flex-col gap-[18px]">
              <p className="leading-[16px] text-base font-[600] text-primary">
                Contract Function
              </p>

              {/* Contract Address Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-primary">
                  Contract Address
                </label>
                <Input
                  placeholder="Enter contract address (e.g., CA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ)"
                  value={contractOutcome?.address || ""}
                  onChange={(e) => handleContractAddressChange(e.target.value)}
                  className={contractError ? "border-red-500" : ""}
                />
              </div>

              {/* Contract Function Selector */}
              {contractOutcome?.address && (
                <EnhancedContractFunctionSelector
                  contractAddress={contractOutcome.address}
                  network={network}
                  onFunctionSelect={handleContractFunctionSelect}
                  selectedFunction={contractOutcome.execute_fn}
                  initialArgs={contractOutcome.args}
                />
              )}

              {contractError && (
                <p className="mt-1 text-sm text-red-500">{contractError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutcomeInput;
