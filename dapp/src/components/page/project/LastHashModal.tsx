import { useCallback } from "react";
import type { FC } from "react";
import Modal from "components/utils/Modal";
import Button from "components/utils/Button";
import CopyButton from "components/utils/CopyButton";

interface LastHashModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitData?: {
    sha: string;
    html_url: string;
    date: string;
    author: string;
  };
}

const LastHashModal: FC<LastHashModalProps> = ({
  isOpen,
  onClose,
  commitData,
}) => {
  if (!isOpen) return null;

  const handleViewHash = useCallback(() => {
    if (commitData?.html_url) {
      window.open(commitData.html_url, "_blank");
    }
  }, [commitData?.html_url]);

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-[18px]">
        <img
          src="/images/scan.svg"
          className="w-16 h-16 sm:w-auto sm:h-auto mx-auto sm:mx-0 mb-2 sm:mb-0"
        />
        <div className="flex-grow flex flex-col gap-6 sm:gap-9">
          <div className="flex flex-col gap-6 sm:gap-9">
            <h6 className="leading-6 text-xl sm:text-2xl font-medium text-primary text-center sm:text-left">
              Latest Commit Hash
            </h6>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col items-start gap-2 sm:gap-[18px]">
                <p className="text-sm sm:text-base text-tertiary">Hash</p>
                <div className="p-2 sm:p-[12px_18px] flex items-center gap-2 sm:gap-[18px] bg-[#FFEFA8] w-full">
                  <p className="commit-hash text-base sm:text-xl text-primary break-all pr-2">
                    {commitData?.sha
                      ? `${commitData.sha.slice(0, 24)}...`
                      : "No hash data available"}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
                    <CopyButton
                      textToCopy={commitData?.html_url || ""}
                      size="sm"
                    />
                    <a
                      className="p-2 hover:bg-gray-100 rounded"
                      href={commitData?.html_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open commit in new tab"
                    >
                      <img
                        src="/icons/link.svg"
                        className="w-4 h-4 sm:w-auto sm:h-auto"
                        alt="Open link"
                      />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:gap-[18px]">
                <p className="text-sm sm:text-base text-tertiary">Hash Date</p>
                <p className="commit-date text-base sm:text-xl text-primary">
                  {commitData?.date || "No date available"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:gap-[18px]">
                <p className="text-sm sm:text-base text-tertiary">
                  Hash Author
                </p>
                <p className="commit-author text-base sm:text-xl text-primary">
                  {commitData?.author
                    ? `@${commitData.author}`
                    : "No author available"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Button
              onClick={handleViewHash}
              icon="/icons/logos/web_white.svg"
              className="w-full sm:w-auto"
            >
              View Hash on Web-Site
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LastHashModal;
