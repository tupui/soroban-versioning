import React from "react";
import { useState, useEffect } from "react";
import JsonView from "react18-json-view";
import { modifySlashInXdr, processDecodedData } from "utils/utils";
import { stellarLabViewXdrLink } from "constants/serviceLinks";
import { demoOutcomeData } from "constants/demoProposalData";

interface VotersModalProps {
  xdr: string;
  onClose: () => void;
}

const VotersModal: React.FC<VotersModalProps> = ({ xdr, onClose }) => {
  const [content, setContent] = useState<any>(null);

  const signAndExecute = () => {};

  const getContentFromXdr = async (_xdr: string) => {
    try {
      if (_xdr) {
        const decoded = processDecodedData(_xdr);
        console.log("decode:", decoded);
        setContent(demoOutcomeData);
      }
    } catch (error) {
      console.error("Error decoding XDR:", error);
    }
  };

  useEffect(() => {
    getContentFromXdr(xdr);
  }, [xdr]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal relative w-80 sm:w-max sm:max-w-[90%] md:max-w-[620px] px-3 sm:px-5 md:px-9 py-2 sm:py-6 md:py-12 rounded-lg sm:rounded-xl md:rounded-[20px] bg-white my-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1 sm:gap-2">
          <div className="text-sm sm:text-lg md:text-[22px]">Outcome</div>
          <div className="flex flex-col gap-1 sm:gap-2 md:gap-3">
            <a
              href={`${stellarLabViewXdrLink}${modifySlashInXdr(xdr)};;`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-0.5 sm:gap-1 text-black hover:text-blue  group"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                id="Stellar--Streamline-Simple-Icons.svg"
                height="24"
                width="24"
                fill="#000000"
                className="group-hover:fill-blue w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
              >
                <desc>Stellar Streamline Icon: https://streamlinehq.com</desc>
                <title>Stellar</title>
                <path
                  d="M12.283 1.851A10.154 10.154 0 0 0 1.846 12.002c0 0.259 0.01 0.516 0.03 0.773A1.847 1.847 0 0 1 0.872 14.56L0 15.005v2.074l2.568 -1.309 0.832 -0.424 0.82 -0.417 14.71 -7.496 1.653 -0.842L24 4.85V2.776l-3.387 1.728 -2.89 1.473 -13.955 7.108a8.376 8.376 0 0 1 -0.07 -1.086 8.313 8.313 0 0 1 12.366 -7.247l1.654 -0.843 0.247 -0.126a10.154 10.154 0 0 0 -5.682 -1.932zM24 6.925 5.055 16.571l-1.653 0.844L0 19.15v2.072L3.378 19.5l2.89 -1.473 13.97 -7.117a8.474 8.474 0 0 1 0.07 1.092A8.313 8.313 0 0 1 7.93 19.248l-0.101 0.054 -1.793 0.914a10.154 10.154 0 0 0 16.119 -8.214c0 -0.26 -0.01 -0.522 -0.03 -0.78a1.848 1.848 0 0 1 1.003 -1.785L24 8.992Z"
                  stroke-width="1"
                ></path>
              </svg>
              <span className="text-xs sm:text-sm md:text-base">
                View in Stellar Lab
              </span>
            </a>
            <div
              className={`transition-all duration-300 "max-h-24" overflow-hidden flex flex-col bg-zinc-100 border border-zinc-400 rounded-xl`}
            >
              <div className="jsonview-body w-full">
                <div className="max-h-40 md:max-h-96 overflow-y-auto px-1 sm:px-3 md:px-5 py-2 sm:py-3 md:py-4">
                  <JsonView src={content} theme="vscode" />
                </div>
              </div>
            </div>
          </div>
          <button
            className="bg-black text-white mt-4 mb-1 py-1 px-4 rounded-lg text-lg"
            onClick={signAndExecute}
          >
            Sign
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotersModal;
