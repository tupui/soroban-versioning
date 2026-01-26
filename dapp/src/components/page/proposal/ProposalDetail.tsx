import Button from "components/utils/Button";
import Modal from "components/utils/Modal";
import Markdown from "markdown-to-jsx";
import React, { useEffect, useState } from "react";
import JsonView from "react18-json-view";
import type { ProposalOutcome, OutcomeContract } from "types/proposal";
import { parseToLosslessJson } from "utils/passToLosslessJson";
import * as StellarXdr from "utils/stellarXdr";
import { capitalizeFirstLetter } from "utils/utils";
import { getIpfsBasicLink } from "utils/ipfsFunctions";

import "github-markdown-css";
import "react18-json-view/src/style.css";

interface ProposalDetailProps {
  ipfsLink: string | null;
  description: string;
  outcome: ProposalOutcome | null;
}

const ProposalDetail: React.FC<ProposalDetailProps> = ({
  ipfsLink,
  description,
  outcome,
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await StellarXdr.initialize();
      setIsReady(true);
    };

    init();
  }, []);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <p className="text-2xl font-medium text-primary">
            Proposal Description
          </p>
          <Button
            type="secondary"
            icon="/icons/ipfs.svg"
            onClick={() =>
              ipfsLink && window.open(getIpfsBasicLink(ipfsLink), "_blank")
            }
          >
            View IPFS
          </Button>
        </div>
        <div className="markdown-body w-full px-4 sm:px-6 md:px-8 py-6">
          {description ? (
            <Markdown>{description}</Markdown>
          ) : (
            <p className="text-gray-500 italic">
              No description available or IPFS content could not be loaded.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <p className="text-2xl font-medium text-primary">Proposal Outcome</p>
        </div>
        <div className="flex flex-col gap-3">
          {outcome &&
            Object.entries(outcome).map(([key, value]) => (
              <OutcomeDetail
                key={key}
                type={key}
                detail={value}
                isXdrInit={isReady}
              />
            ))}
          {!outcome && (
            <p className="p-[30px] text-gray-500 italic bg-white">
              No outcome data available or IPFS content could not be loaded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;

export const OutcomeDetail: React.FC<{
  type: string;
  detail: { description: string; xdr?: string; contract?: OutcomeContract };
  isXdrInit: boolean;
}> = ({ type, detail, isXdrInit }) => {
  const [content, setContent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const getContentFromXdr = async (_xdr: string) => {
    try {
      if (!isXdrInit) {
        return;
      }

      if (_xdr) {
        const decoded = StellarXdr.decode("TransactionEnvelope", _xdr);
        setContent(parseToLosslessJson(decoded));
      }
    } catch (error) {
      console.error("Error decoding XDR:", error);
    }
  };

  useEffect(() => {
    if (detail.xdr) {
      getContentFromXdr(detail.xdr);
    }
  }, [detail, isXdrInit]);

  const renderActionButton = () => {
    if (detail.contract) {
      return (
        <Button
          type="secondary"
          icon="/icons/code.svg"
          onClick={() =>
            window.open(
              `https://stellar.expert/explorer/testnet/contract/${detail.contract?.address}`,
              "_blank",
            )
          }
        >
          <p className="text-xl text-primary">View Contract</p>
        </Button>
      );
    }

    if (content) {
      return (
        <Button
          type="secondary"
          icon="/icons/eye.svg"
          onClick={() => setShowModal(true)}
        >
          <p className="text-xl text-primary">View XDR</p>
        </Button>
      );
    }

    return null;
  };

  const renderModalContent = () => {
    if (detail.contract) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            Contract Execution Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Contract Address
              </label>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
                {detail.contract.address}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Function Name
              </label>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                {detail.contract.execute_fn}
              </p>
            </div>
            {detail.contract.args && detail.contract.args.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Arguments
                </label>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(detail.contract.args, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (content) {
      return (
        <div className="max-h-[75vh] overflow-y-auto">
          <JsonView src={content} theme="vscode" />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-[30px] flex justify-between items-center bg-white">
      <div className="flex flex-col gap-3">
        <p className={`text-xl font-medium text-${type}`}>
          {capitalizeFirstLetter(type || "")}
        </p>
        <p className="text-base font-semibold text-primary">
          {detail.description}
        </p>
        {detail.contract && (
          <div className="text-sm text-secondary">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Contract-based execution
          </div>
        )}
        {detail.xdr && (
          <div className="text-sm text-secondary">
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            XDR-based execution
          </div>
        )}
      </div>
      {renderActionButton()}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          {renderModalContent()}
        </Modal>
      )}
    </div>
  );
};
