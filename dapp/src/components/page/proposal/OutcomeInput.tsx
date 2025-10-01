import Button from "components/utils/Button";
import Textarea from "components/utils/Textarea";
import Input from "components/utils/Input";
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
  contractAddress?: string | null;
  setContractAddress?: (address: string | null) => void;
  useContract?: boolean;
  setUseContract?: (useContract: boolean) => void;
}

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
  contractAddress,
  setContractAddress,
  useContract,
  setUseContract,
}: OutcomeInputProps) => {
  const [outcomeMethod, setOutcomeMethod] = useState<'none' | 'xdr' | 'contract'>('none');

  useEffect(() => {
    if (useContract) {
      setOutcomeMethod('contract');
    } else if (xdr !== null) {
      setOutcomeMethod('xdr');
    } else {
      setOutcomeMethod('none');
    }
  }, [useContract, xdr]);

  const handleMethodChange = (method: 'none' | 'xdr' | 'contract') => {
    setOutcomeMethod(method);
    
    if (method === 'none') {
      setXdr(null);
      if (setUseContract) setUseContract(false);
      if (setContractAddress) setContractAddress(null);
    } else if (method === 'xdr') {
      setXdr("");
      if (setUseContract) setUseContract(false);
      if (setContractAddress) setContractAddress(null);
    } else if (method === 'contract') {
      setXdr(null);
      if (setUseContract) setUseContract(true);
    }
  };

  return (
    <div className="flex flex-col items-start gap-[18px]">
      <div className={`text-xl font-medium text-${type}`}>
        {capitalizeFirstLetter(type)} Outcome
      </div>
      {outcomeMethod === 'none' ? (
        <div className="flex gap-3">
          <Button type="secondary" onClick={() => handleMethodChange('xdr')}>
            Add XDR Outcome
          </Button>
          {type === 'approved' && (
            <Button type="secondary" onClick={() => handleMethodChange('contract')}>
              Add Contract Call
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col gap-[18px]">
          {type === 'approved' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-secondary">Outcome Method</label>
              <select
                className="px-3 py-2 border border-zinc-700 rounded-md bg-transparent text-primary"
                value={outcomeMethod}
                onChange={(e) => handleMethodChange(e.target.value as 'xdr' | 'contract')}
              >
                <option value="xdr">XDR Transaction</option>
                <option value="contract">Contract Call</option>
              </select>
            </div>
          )}
          
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
          
          {outcomeMethod === 'xdr' && (
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
          )}
          
          {outcomeMethod === 'contract' && type === 'approved' && (
            <div className="flex flex-col gap-[18px]">
              <div className="flex items-center gap-2">
                <p className="leading-[16px] text-base font-[600] text-primary">
                  Contract Address
                </p>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 underline"
                >
                  How to create outcome contracts?
                </a>
              </div>
              <div>
                <Input
                  placeholder="Enter contract address (e.g., CA...)"
                  value={contractAddress || ""}
                  onChange={(e) => {
                    if (setContractAddress) setContractAddress(e.target.value);
                  }}
                />
                {contractAddress && contractAddress.length === 56 && (
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={`https://stellar.expert/explorer/public/contract/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 underline"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-secondary mb-2">
                  <strong>Note:</strong> This contract will handle all three outcomes (approved, rejected, cancelled).
                </p>
                <p className="text-sm text-secondary">
                  Download templates:
                </p>
                <div className="flex gap-2 mt-1">
                  <a
                    href="/"
                    download
                    className="text-sm text-blue-500 underline"
                  >
                    Basic Template
                  </a>
                  <a
                    href="/"
                    download
                    className="text-sm text-blue-500 underline"
                  >
                    Treasury Distribution
                  </a>
                  <a
                    href="/"
                    download
                    className="text-sm text-blue-500 underline"
                  >
                    Contract Upgrade
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutcomeInput;