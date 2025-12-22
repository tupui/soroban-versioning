import React, { useState, useEffect } from "react";
import Input from "components/utils/Input";
import Button from "components/utils/Button";
import {
  getContractFunctions,
  isValidContractAddress,
  type ContractFunction,
  type ContractFunctionInput,
} from "@service/ContractIntrospectionService";
import type { OutcomeContract } from "types/proposal";

interface EnhancedContractFunctionSelectorProps {
  contractAddress: string;
  network: string;
  onFunctionSelect: (functionName: string, args: any[]) => void;
  selectedFunction?: string;
  initialArgs?: any[];
}

export const EnhancedContractFunctionSelector: React.FC<
  EnhancedContractFunctionSelectorProps
> = ({
  contractAddress,
  network,
  onFunctionSelect,
  selectedFunction: initialSelectedFunction,
  initialArgs = [],
}) => {
  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>(
    initialSelectedFunction || "",
  );
  const [args, setArgs] = useState<any[]>(initialArgs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load functions when contract address changes
  useEffect(() => {
    if (isValidContractAddress(contractAddress)) {
      loadContractFunctions();
    } else {
      setFunctions([]);
      setSelectedFunction("");
      setArgs([]);
    }
  }, [contractAddress, network]);

  // Update args when selected function changes
  useEffect(() => {
    if (selectedFunction && functions.length > 0) {
      const func = functions.find((f) => f.name === selectedFunction);
      if (func) {
        // Initialize args array with proper length and types
        const newArgs = func.inputs.map((input, index) => {
          if (initialArgs[index] !== undefined) {
            return initialArgs[index];
          }
          // Default values based on type
          switch (input.type.toLowerCase()) {
            case "u64":
            case "u32":
            case "u128":
            case "u256":
              return 0;
            case "i64":
            case "i32":
            case "i128":
            case "i256":
              return 0;
            case "bool":
              return false;
            case "string":
            case "symbol":
              return "";
            case "address":
              return "";
            case "bytes":
              return "";
            default:
              return "";
          }
        });
        setArgs(newArgs);
      }
    }
  }, [selectedFunction, functions]);

  // Notify parent component when function or args change
  useEffect(() => {
    if (selectedFunction && args.length >= 0) {
      onFunctionSelect(selectedFunction, args);
    }
  }, [selectedFunction, args]); // Removed onFunctionSelect from dependencies

  const loadContractFunctions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const contractFuncs = await getContractFunctions(
        contractAddress,
        network as "testnet" | "mainnet",
      );
      setFunctions(contractFuncs);
    } catch (err: any) {
      console.warn("Contract introspection failed:", err.message);
      setFunctions([]); // No functions available
      setError(
        "Contract introspection not available for this contract. Please enter function details manually below.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFunctionSelect = (functionName: string) => {
    setSelectedFunction(functionName);
    setShowDropdown(false);
  };

  const handleArgChange = (index: number, value: any) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const selectedFunc = functions.find((f) => f.name === selectedFunction);

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

          {functions.length > 0 ? (
            /* Custom dropdown for function selection when functions are available */
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-full p-3 border rounded-md text-left flex justify-between items-center ${
                  selectedFunction ? "border-gray-300" : "border-gray-300"
                }`}
                disabled={isLoading || !isValidContractAddress(contractAddress)}
              >
                <span
                  className={
                    selectedFunction ? "text-primary" : "text-secondary"
                  }
                >
                  {isLoading
                    ? "Loading functions..."
                    : selectedFunction || "Select a function"}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {functions.map((func) => (
                    <button
                      key={func.name}
                      type="button"
                      onClick={() => handleFunctionSelect(func.name)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="font-medium text-primary">
                        {func.name}
                      </div>
                      <div className="text-xs text-secondary">
                        {func.inputs.length > 0
                          ? `(${func.inputs.map((i) => i.type).join(", ")})`
                          : "(no inputs)"}
                        {func.outputs && func.outputs.length > 0
                          ? ` → ${func.outputs.map((o) => o.type).join(", ")}`
                          : ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Manual input when contract introspection failed */
            <div>
              <Input
                placeholder="Enter function name (e.g., transfer, approve, mint)"
                value={selectedFunction}
                onChange={(e) => {
                  setSelectedFunction(e.target.value);
                  // Reset args when function changes
                  if (!selectedFunction) {
                    setArgs([]);
                  }
                }}
                className="font-mono"
              />
              <p className="text-xs text-secondary mt-1">
                Contract introspection failed. Please enter the function name
                manually.
              </p>
            </div>
          )}
        </div>

        {/* Arguments section */}
        {selectedFunction &&
          (selectedFunc && selectedFunc.inputs.length > 0 ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-primary">
                Arguments
              </label>

              {selectedFunc.inputs.map(
                (input: ContractFunctionInput, index: number) => (
                  <div key={index}>
                    <label className="block text-xs font-medium text-secondary mb-1">
                      {input.name} ({input.type})
                    </label>
                    <ArgInput
                      type={input.type}
                      value={args[index]}
                      onChange={(value) => handleArgChange(index, value)}
                    />
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-primary">
                Arguments (JSON Array)
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="[]"
                value={args.length > 0 ? JSON.stringify(args, null, 2) : "[]"}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed)) {
                      setArgs(parsed);
                    }
                  } catch {
                    // Invalid JSON, keep current value
                  }
                }}
                rows={4}
              />
              <p className="text-xs text-secondary">
                Arguments as a JSON array (e.g., ["arg1", 123, true]). Contract
                introspection failed, so please enter arguments manually.
              </p>
            </div>
          ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

// Component for different argument input types
interface ArgInputProps {
  type: string;
  value: any;
  onChange: (value: any) => void;
}

const ArgInput: React.FC<ArgInputProps> = ({ type, value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Type-specific parsing
    switch (type.toLowerCase()) {
      case "u64":
      case "u32":
      case "u128":
      case "u256":
      case "i64":
      case "i32":
      case "i128":
      case "i256":
        const numValue = parseInt(inputValue, 10);
        onChange(isNaN(numValue) ? 0 : numValue);
        break;
      case "bool":
        onChange(inputValue.toLowerCase() === "true");
        break;
      default:
        onChange(inputValue);
        break;
    }
  };

  const getInputType = () => {
    switch (type.toLowerCase()) {
      case "u64":
      case "u32":
      case "u128":
      case "u256":
      case "i64":
      case "i32":
      case "i128":
      case "i256":
        return "number";
      case "bool":
        return "text"; // We'll handle boolean parsing
      default:
        return "text";
    }
  };

  const getPlaceholder = () => {
    switch (type.toLowerCase()) {
      case "address":
        return "G... (Stellar address)";
      case "u64":
      case "u32":
      case "u128":
      case "u256":
      case "i64":
      case "i32":
      case "i128":
      case "i256":
        return "0";
      case "bool":
        return "true or false";
      case "string":
        return "Enter text";
      case "symbol":
        return "Enter symbol";
      case "bytes":
        return "Hex bytes";
      default:
        return "Enter value";
    }
  };

  if (type.toLowerCase() === "bool") {
    return (
      <select
        value={value ? "true" : "false"}
        onChange={(e) => onChange(e.target.value === "true")}
        className="w-full p-3 border border-gray-300 rounded-md"
      >
        <option value="false">false</option>
        <option value="true">true</option>
      </select>
    );
  }

  return (
    <Input
      type={getInputType()}
      placeholder={getPlaceholder()}
      value={value === undefined || value === null ? "" : value}
      onChange={handleChange}
      className="font-mono text-sm"
    />
  );
};

export default EnhancedContractFunctionSelector;
