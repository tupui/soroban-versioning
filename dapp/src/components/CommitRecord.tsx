import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "astro:transitions/client";
import JsonView from "react18-json-view";
import CopyButton from "components/utils/CopyButton";
import { loadProjectLatestSha } from "../service/StateService.ts";

interface CommitRecordProps {
  /** Main title line – for on-chain rows this is a concise summary */
  message: string;
  /** Author display name (GitHub user or member address) */
  authorName?: string;
  /** Link to author profile (GitHub, explorer, …) */
  authorLink?: string;
  /** Commit / tx hash */
  sha?: string;
  /** External link for the hash (GitHub commit page or explorer tx) */
  shaLink?: string;
  /** Backwards compatibility – project page still passes commitLink */
  commitLink?: string;
  /** Whether the author is a project maintainer (adds the green badge) */
  isMaintainer?: boolean;
  /** Extra Tailwind class for background colour */
  bgClass?: string;
  /** Project name – if provided a blue pill navigates to project page */
  projectName?: string | null;
  /** Any raw payload (XDR, Horizon record, …) shown in collapsible view */
  showXDR?: unknown | null;
  /** Optional link to related proposal page */
  proposalLink?: string | null | undefined;
}

const CommitRecord: React.FC<CommitRecordProps> = ({
  message,
  authorName,
  authorLink,
  sha,
  shaLink,
  commitLink,
  isMaintainer = false,
  bgClass = "bg-white",
  projectName = null,
  showXDR = null,
  proposalLink = null,
}) => {
  const messageRef = useRef<HTMLAnchorElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [isLatestCommit, setIsLatestCommit] = useState(false);

  const [firstLine, ...otherLines] = useMemo(
    () =>
      message
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    [message],
  );

  const hasMoreLines = isOverflowing || otherLines.length > 0;

  useEffect(() => {
    if (!sha) return;
    setIsLatestCommit(sha === loadProjectLatestSha());
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const handleNavigateProject = () => {
    if (projectName)
      navigate(`/project?name=${encodeURIComponent(projectName)}`);
  };

  // ---------------------------------------------------------------------------

  return (
    <div
      className={`relative p-[15px] lg:p-[30px] flex flex-col gap-3 ${bgClass}`}
    >
      {(isLatestCommit || isMaintainer) && (
        <div className="absolute top-0.5 left-1 flex space-x-1">
          {isLatestCommit && (
            <span className="text-xs font-bold leading-3 bg-lime rounded-sm p-0.5">
              verified commit
            </span>
          )}
          {/* {isMaintainer && (
            <span className="text-xs font-bold leading-3 rounded-sm p-0.5">
              maintainer
            </span>
          )} */}
        </div>
      )}

      {/* Project pill */}
      {projectName && (
        <button
          onClick={handleNavigateProject}
          className="self-start mb-2 px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-sm hover:bg-blue-700 cursor-pointer"
        >
          {projectName}
        </button>
      )}

      {/* Title & hash */}
      <div className="flex justify-between items-start">
        <div className="w-[calc(100%-120px)] flex gap-2 items-start">
          <a
            ref={messageRef}
            href={commitLink || shaLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-base lg:text-xl font-medium text-primary hover:underline ${!isExpanded && "line-clamp-1"}`}
          >
            {firstLine}
          </a>
          {hasMoreLines && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-0.5"
            >
              <img
                src={
                  isExpanded
                    ? "/icons/chevron-up.svg"
                    : "/icons/chevron-down.svg"
                }
              />
            </button>
          )}
        </div>
        {sha && (
          <div className="flex items-center gap-1">
            <CopyButton
              textToCopy={sha}
              size="sm"
              className="hover:bg-zinc-400"
            />
            <a
              href={shaLink || commitLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm lg:text-lg text-primary underline"
            >
              {sha.substring(0, 7)}
            </a>
          </div>
        )}
      </div>

      {hasMoreLines && isExpanded && (
        <div className="whitespace-pre-wrap break-all break-words text-base text-secondary">
          {otherLines.join("\n")}
          {proposalLink && (
            <div className="mt-2">
              <a
                href={proposalLink}
                className="text-blue-600 underline break-all"
              >
                View proposal ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Author (no date – grouping done by parent) */}
      {authorName && (
        <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
          <a
            href={authorLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 bg-zinc-100 text-primary font-bold"
          >
            @{authorName}
          </a>
          {isMaintainer && (
            <span className="text-xs font-medium bg-lime px-1 rounded-sm">
              maintainer
            </span>
          )}
        </div>
      )}

      {/* Raw toggle */}
      {!!showXDR && (
        <div className="mt-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-blue-600 underline cursor-pointer"
          >
            {showRaw ? "Hide raw transaction" : "Show raw transaction"}
          </button>
          {showRaw && (
            <div className="mt-2 max-h-96 overflow-auto bg-zinc-50 p-2 rounded text-xs">
              {/* JsonView provides nice folding – fallback to <pre> if not available */}
              <JsonView src={showXDR as any} theme="vscode" collapsed={2} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommitRecord;
