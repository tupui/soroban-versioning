import { useEffect, useMemo, useRef, useState } from "react";
import { loadProjectLatestSha } from "../../../service/StateService.ts";
import { formatTime } from "../../../utils/formatTimeFunctions";

const CommitRecord = ({
  message,
  date,
  authorName,
  authorGithubLink,
  sha,
  commitLink,
  isMaintainer,
}) => {
  const messageRef = useRef();
  const [isCopied, setIsCopied] = useState(false);
  const [isLatestCommit, setIsLatestCommit] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [firstLine, ...formattedMessage] = useMemo(() =>
    message.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
  );

  const hasMoreLines = isOverflowing || formattedMessage.length > 1;

  useEffect(() => {
    const highlightLatestCommit = () => {
      setIsLatestCommit(sha === loadProjectLatestSha());
    };
    highlightLatestCommit();
  }, [sha]);

  useEffect(() => {
    const checkOverflow = () => {
      if (messageRef.current) {
        setIsOverflowing(
          messageRef.current.scrollHeight > messageRef.current.clientHeight,
        );
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [message]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sha);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div
      className="commit-record relative p-[15px] lg:p-[30px] flex justify-between items-start bg-white"
      data-sha={sha}
      id={isLatestCommit ? "latest-commit-record" : undefined}
    >
      {(isLatestCommit || isMaintainer) && (
        <div className="absolute top-0.5 left-1 flex space-x-1">
          {isLatestCommit && (
            <div className="relative group">
              <div className="text-xs font-bold tracking-tighter leading-3 bg-lime rounded-sm p-0.5">
                verified commit
              </div>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block">
                <div className="bg-black text-white text-xs py-1 px-2 rounded shadow-lg w-max max-w-[60vw] break-words">
                  This commit was verified on-chain by a maintainer
                  <div className="absolute left-4 top-full border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
          )}
          {isMaintainer && (
            <div className="relative group">
              <div className="text-xs font-bold text-green-500 tracking-tighter leading-3 bg-blue-200 rounded-sm p-0.5">
                verified maintainer
              </div>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block">
                <div className="bg-black text-white text-xs py-1 px-2 rounded shadow-lg w-max max-w-[60vw] break-words">
                  This maintainer is allowed to register new commit hash
                  on-chain
                  <div className="absolute left-4 top-full border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="commit-info flex-grow flex flex-col gap-3 lg:gap-6 overflow-hidden">
        <div className="flex justify-between">
          <div className="w-[calc(100%-120px)] flex items-start gap-3">
            <a
              ref={messageRef}
              href={commitLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`commit-message text-base lg:text-xl font-medium text-primary hover:underline hover:text-blue-500 ${!isExpanded && "line-clamp-1"}`}
            >
              {firstLine}
            </a>
            {hasMoreLines && (
              <button
                className="mt-1 expand-button"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <img src="/icons/chevron-up.svg" />
                ) : (
                  <img src="/icons/chevron-down.svg" />
                )}
              </button>
            )}
          </div>
          <div className="commit-sha flex items-center gap-[5px] lg:gap-[10px]">
            {/* <img src="/icons/logos/github.svg" /> */}
            <button
              className="copy-button hover:bg-zinc-400 transition-colors duration-200 p-1 rounded"
              onClick={handleCopy}
            >
              {isCopied ? (
                <img src="/icons/check.svg" />
              ) : (
                <img src="/icons/clipboard.svg" />
              )}
            </button>
            <a
              href={commitLink}
              target="_blank"
              rel="noopener noreferrer"
              className="sha leading-[18px] text-sm lg:text-lg text-primary underline"
            >
              {sha.substring(0, 7)}
            </a>
          </div>
        </div>
        {hasMoreLines && isExpanded && (
          <div className="expanded-message text-base text-secondary whitespace-pre-wrap">
            {formattedMessage.join("\n")}
          </div>
        )}
        <div className="commit-details text-sm text-gray-600 mt-1">
          <a
            href={authorGithubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="author-name p-[6px_14px] bg-[#F5F5F5] leading-4 text-base font-bold text-[#2D0F51]"
          >
            @{authorName}
          </a>
          <span className="leading-4 text-base font-bold text-secondary">
            {" "}
            committed on
          </span>
          <span className="commit-date text-[#2D0F51]">
            {" "}
            {formatTime(date)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommitRecord;
