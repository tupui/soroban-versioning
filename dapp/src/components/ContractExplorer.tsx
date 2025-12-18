import React, { useState } from "react";
import Input from "components/utils/Input";
import Button from "components/utils/Button";
import type { OutcomeContract } from "types/proposal";

interface ContractExplorerProps {
  network: string;
  onFunctionSelect: (
    contractAddress: string,
    functionName: string,
    args: any[],
  ) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const ContractExplorer: React.FC<ContractExplorerProps> = ({
  network,
  onFunctionSelect,
  onClose,
  isOpen = false,
}) => {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [functionName, setFunctionName] = useState<string>("");
  const [args, setArgs] = useState<string>("[]");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateContractAddress = (address: string): boolean => {
    // Basic Stellar address validation (starts with G and is 56 characters)
    return /^G[A-Z0-9]{55}$/.test(address);
  };

  const validateFunctionName = (name: string): boolean => {
    return name.trim().length > 0 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  };

  const validateArgs = (argsStr: string): boolean => {
    try {
      const parsed = JSON.parse(argsStr);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  };

  const handleConfirm = () => {
    setError(null);

    if (!validateContractAddress(contractAddress)) {
      setError("Invalid contract address format");
      return;
    }

    if (!validateFunctionName(functionName)) {
      setError("Invalid function name");
      return;
    }

    if (!validateArgs(args)) {
      setError("Invalid arguments format (must be a JSON array)");
      return;
    }

    try {
      const parsedArgs = JSON.parse(args);
      onFunctionSelect(contractAddress, functionName, parsedArgs);
      onClose?.();
    } catch (err: any) {
      setError("Failed to parse arguments: " + err.message);
    }
  };

  const handleCancel = () => {
    setContractAddress("");
    setFunctionName("");
    setArgs("[]");
    setError(null);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary">
            Select Contract Function
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Contract Address
            </label>
            <Input
              placeholder="G... (56-character Stellar address)"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className={
                contractAddress && !validateContractAddress(contractAddress)
                  ? "border-red-500"
                  : ""
              }
            />
            <p className="text-xs text-secondary mt-1">
              Enter the Stellar contract address (starts with G, 56 characters)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Function Name
            </label>
            <Input
              placeholder="function_name"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className={
                functionName && !validateFunctionName(functionName)
                  ? "border-red-500"
                  : ""
              }
            />
            <p className="text-xs text-secondary mt-1">
              Enter the contract function name to call
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Arguments (JSON Array)
            </label>
            <textarea
              className={`w-full p-3 border rounded-md font-mono text-sm ${
                args && !validateArgs(args)
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="[]"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-secondary mt-1">
              Arguments as a JSON array (e.g., ["arg1", 123, true])
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button type="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !contractAddress ||
              !functionName ||
              !validateContractAddress(contractAddress) ||
              !validateFunctionName(functionName) ||
              !validateArgs(args)
            }
          >
            Select Function
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractExplorer;
