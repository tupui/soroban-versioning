import Button from "components/utils/Button";
import Modal from "components/utils/Modal";
import Markdown from "markdown-to-jsx";
import React, { useEffect, useState } from "react";
import JsonView from "react18-json-view";
import type { ProposalOutcome } from "types/proposal";
import { parseToLosslessJson } from "utils/passToLosslessJson";
import * as StellarXdr from "utils/stellarXdr";
import {
  capitalizeFirstLetter,
  getIpfsBasicLink,
  getOutcomeLinkFromIpfs,
  getProposalLinkFromIpfs,
} from "utils/utils";

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
          <div className="flex items-center gap-3">
            <p className="text-2xl font-medium text-primary">
              Proposal Description
            </p>
            <a
              href={(ipfsLink && getProposalLinkFromIpfs(ipfsLink)) || ""}
              target="_blank"
              rel="noreferrer"
            >
              <img src="/icons/link.svg" />
            </a>
          </div>
          <Button
            type="secondary"
            icon="/icons/eye.svg"
            onClick={() =>
              ipfsLink && window.open(getIpfsBasicLink(ipfsLink), "_blank")
            }
          >
            View IPFS
          </Button>
        </div>
        <div className="markdown-body w-full px-4 sm:px-6 md:px-8 py-6">
          <Markdown>{description}</Markdown>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <p className="text-2xl font-medium text-primary">Proposal Outcome</p>
          <a
            href={(ipfsLink && getOutcomeLinkFromIpfs(ipfsLink)) || ""}
            target="_blank"
            rel="noreferrer"
          >
            <img src="/icons/link.svg" />
          </a>
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
        </div>
      </div>
    </div>
  );
};

export default ProposalDetail;

export const OutcomeDetail: React.FC<{
  type: string;
  detail: { description: string; xdr: string };
  isXdrInit: boolean;
}> = ({ type, detail, isXdrInit }) => {
  const [content, setContent] = useState<any>(null);
  const [showXDRModal, setShowXDRModal] = useState(false);

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
    getContentFromXdr(detail.xdr);
  }, [detail, isXdrInit]);

  return (
    <div className="p-[30px] flex justify-between items-center bg-white">
      <div className="flex flex-col gap-3">
        <p className={`text-xl font-medium text-${type}`}>
          {capitalizeFirstLetter(type || "")}
        </p>
        <p className="text-base font-semibold text-primary">
          {detail.description}
        </p>
      </div>
      {content && (
        <Button
          type="secondary"
          icon="/icons/eye.svg"
          onClick={() => setShowXDRModal(true)}
        >
          <p className="text-xl text-primary">View XDR</p>
        </Button>
      )}
      {showXDRModal && (
        <Modal onClose={() => setShowXDRModal(false)}>
          <div className="max-h-[75vh] overflow-y-auto">
            <JsonView src={content} theme="vscode" />
          </div>
        </Modal>
      )}
    </div>
  );
};
