import React, { useState } from "react";
import Input from "components/utils/Input";
import Button from "components/utils/Button";
import type { OutcomeContract } from "types/proposal";

interface ContractFunctionSelectorProps {
  contractAddress: string;
  network: string;
  onFunctionSelect: (functionName: string, args: any[]) => void;
  selectedFunction?: string;
  initialArgs?: any[];
}

export const ContractFunctionSelector: React.FC<
  ContractFunctionSelectorProps
> = ({
  contractAddress,
  network,
  onFunctionSelect,
  selectedFunction: initialSelectedFunction,
  initialArgs = [],
}) => {
  const [functionName, setFunctionName] = useState<string>(
    initialSelectedFunction || "",
  );
  const [args, setArgs] = useState<string>(
    JSON.stringify(initialArgs, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

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
      onFunctionSelect(functionName, parsedArgs);
    } catch (err: any) {
      setError("Failed to parse arguments: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-primary mb-3">
          Contract Address
        </h3>
        <p className="text-xs font-mono text-secondary break-all bg-gray-50 p-2 rounded">
          {contractAddress}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Function Name
          </label>
          <Input
            placeholder="Enter function name"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className={
              functionName && !validateFunctionName(functionName)
                ? "border-red-500"
                : ""
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Arguments (JSON Array)
          </label>
          <textarea
            className={`w-full p-3 border rounded-md font-mono text-sm ${
              args && !validateArgs(args) ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="[]"
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-secondary mt-1">
            Arguments as a JSON array (e.g., ["arg1", 123, true])
          </p>
        </div>
      </div>

      {functionName && validateFunctionName(functionName) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Function Preview
          </h4>
          <p className="text-sm text-blue-800 font-medium">{functionName}()</p>

          {args && validateArgs(args) && (
            <div className="mt-3">
              <p className="text-xs text-blue-700 mb-1">With arguments:</p>
              <pre className="text-xs bg-white p-2 rounded border overflow-x-auto text-blue-900">
                {args}
              </pre>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleConfirm}
          disabled={
            !functionName ||
            !validateFunctionName(functionName) ||
            !validateArgs(args)
          }
          className="text-sm"
        >
          Confirm Selection
        </Button>
      </div>
    </div>
  );
};

export default ContractFunctionSelector;
